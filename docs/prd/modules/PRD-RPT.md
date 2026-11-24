# L2 Module PRD — RPT: Reporting and analytics

<!-- Single source. The Word file is generated from this Markdown by tools/md2docx.py. -->

## 1. Document control

| Item | Value |
|---|---|
| Module | RPT — Reporting and analytics |
| Version | 1.0 |
| Status | Draft. Not approved. |

**How to read the labels.** Every story, rule and criterion names its basis: **D** = the feature description; **REQ-…** = a client requirement delivered by that feature; **FC-…** = a catalog feature; **FIT** = verified nopCommerce 5.00.1 behaviour; a decision ID. "see XXX-nnn (REQ-…)" points to a requirement delivered by another feature. **Proposed** = a product design choice that needs Product Owner approval. "Not stated in source — requires confirmation" marks a value the product does not fix; developers do not fill it. Gap IDs: KG-nn = KTDA, MG-nn = Malawi Post.

## 2. Purpose and scope

Gives staff ready-made reports and a dashboard inside nopCommerce from day one, and feeds a separate data warehouse and business-intelligence (BI) platform that delivers the KPI catalogue, executive, operational, commerce, marketing, compliance and e-government dashboards, scheduled and self-service reports and report access control. nopCommerce supplies the data (extracts with a data dictionary and pseudonymisation), the KPI catalogue, advertising-spend imports, read-only BI connections and a few in-platform pages (public transparency figures, operator metrics). The BI platform and warehouse themselves are external systems.

**In scope**

- Native reports and admin dashboard, with per-report permissions (RPT-001)
- KPI catalogue in nopCommerce and executive dashboards, drill-down and monthly report in the BI platform (RPT-002)
- Extraction to the data warehouse with change capture, data dictionary, quality-check hand-off and pseudonymisation (RPT-003)
- Scheduled and self-service reports, exports and batch report interfaces (RPT-004)
- Report access control in nopCommerce and in the BI platform (RPT-005)
- Audit, compliance and regulatory reports (RPT-006)
- Public transparency page (RPT-007), external BI connectivity (RPT-008), operator performance metrics (RPT-009)
- Operational dashboards (RPT-010), commerce and marketing analytics with advertising-spend import (RPT-011), e-government and engagement reports (RPT-012)

**Not in this module**

| Item | Where it is |
|---|---|
| Data warehouse, ETL tool and BI platform products | External systems (L1 §6.9); products not named (KG-17, MG-12) |
| Stock-movement data behind the stock reports (units sold per period, sell rate, days of cover, daily stock snapshot), dead stock and ABC classes | INV module (PRD-INV-013) supplies the data; RPT-001 owns the fast and slow movers and stock-level reports (decision ANL-002-OWN) |
| Logistics KPI dashboard inside nopCommerce | LOG module (PRD-LOG-018); RPT-010 uses the same definitions through the KPI catalogue |
| Personal operator dashboard and work queues | ADM module (PRD-ADM-007) |
| Audit store with before and after values; auditor read-only access | SEC module (PRD-SEC-004, SEC-010) |
| Field classification and masking | SEC module (PRD-SEC-014) |
| Marketing tags (Google Analytics 4 and others) | MKT module (PRD-MKT-010) |
| Customer segmentation attributes (age group, rural or urban, customer type) | MKT module (PRD-MKT-011) |
| Public REST API and API gateway | INT module (PRD-INT-001, INT-002) |
| Return, support and payment operational reports inside their modules | RET-009, CRM-005, PAY-014, PAY-019 |

## 3. Feature summary

| PRD ID | Feature | Channel | Phase | Implementation | Code change | Pack | Depends on | Held by |
|---|---|---|---|---|---|---|---|---|
| PRD-RPT-001 | Standard reports and dashboard | Platform / back-office | P1 | Code-level | Custom plugin | Core (always on) | | |
| PRD-RPT-002 | KPI framework and executive dashboards | Platform / back-office | P1 | External system | External system + integration plugin | Core (always on) | PRD-RPT-003 | PAID-STUB |
| PRD-RPT-003 | Data warehouse and ETL | Platform / back-office | P1 | External system | External system + integration plugin | Core (always on) | | |
| PRD-RPT-004 | Report delivery and self-service | Platform / back-office | P1 | External system | External system + integration plugin | Core (always on) | | |
| PRD-RPT-005 | Report access control | Platform / back-office | P1 | External system | External system + integration plugin | Core (always on) | | |
| PRD-RPT-006 | Compliance and audit reports | Platform / back-office | P1 | External system | External system + integration plugin | Core (always on) | | |
| PRD-RPT-007 | Public transparency dashboard | Platform / back-office | P3 | Code-level | Custom plugin | Analytics pack | | |
| PRD-RPT-008 | External BI connectivity | Platform / back-office | P2 | Licensed plugin | None | Analytics pack | | PAID-STUB |
| PRD-RPT-009 | Operator performance metrics | Platform / back-office | P2 | Code-level | Custom plugin | Core (always on) | | |
| PRD-RPT-010 | Operational dashboards | Platform / back-office | P1 | External system | External system + integration plugin | Analytics pack | PRD-RPT-002 | PAID-STUB |
| PRD-RPT-011 | Commerce and marketing analytics | Platform / back-office | P1 | External system | External system + integration plugin | Core (both clients) | PRD-RPT-002 | PAID-STUB |
| PRD-RPT-012 | e-Government and engagement reports | G2C / G2B | P1 | External system | External system + integration plugin | e-Government pack | PRD-RPT-002 | FG-06, PAID-STUB |

## 4. Actors and permissions

| Actor | What they do in this module | Role in nopCommerce |
|---|---|---|
| Manager (client management) | Reads the dashboard, executive dashboards and reports | Administrators or a management role (role names from BR-IAM-050; a management role is not in the catalogue — client configuration) |
| Analyst | Maintains the KPI catalogue, queries data views, builds dashboards in the BI platform | Role system name "Analyst" (BR-IAM-050) |
| Marketing staff | Imports advertising and campaign spend; reads marketing analytics | Role system name "Marketing" (BR-IAM-050) |
| Operations manager | Reads operational dashboards and operator metrics | Role system name "OperationsManager" (BR-IAM-050) |
| Compliance staff and auditors | Read audit, compliance and regulatory reports | Role system name "Auditor" (BR-IAM-050, SEC-010); BI group |
| Client administrator | Configures extracts, pseudonymisation, BI connections, public metrics, report permissions | Administrators (native) |
| Data warehouse and ETL (system) | Receives extracts, runs quality checks, stores history | External system (not named, MG-12) |
| BI platform (system) | Dashboards, drill-down, schedules, self-service, row and field security | External system (not named, KG-17); Power BI plugin option (PAID-STUB) |
| Other government or Malawi Post systems | Receive report data by API or batch file as authorised | External; not named |
| The public | Reads the public transparency page without signing in | Guests (native) |

| Permission (system name) | Category | Allows | Default roles |
|---|---|---|---|
| Reports.SalesSummary, Reports.CountrySales, Reports.LowStock, Reports.Bestsellers, Reports.ProductsNeverPurchased, Reports.RegisteredCustomers, Reports.CustomersByOrderTotal, Reports.CustomersByNumberOfOrders (native) | Reports | Each native report (together with Orders.OrdersView, Catalog.ProductsView or Customers.CustomersView as the native action requires) | Administrators; others per client |
| Analytics.Core.StockReports.View | Reports | Run the fast and slow movers and stock-level report (RPT-001, data from INV-013) | Administrators |
| Analytics.Core.Extract.CreateEditDelete | Configuration | Configure extract datasets, schedules, pseudonymisation rules; rerun extracts | Administrators |
| Analytics.Core.Extract.View | Reports | See extract runs, manifests and the data dictionary | Administrators, Analyst |
| Analytics.Core.KpiCatalogue.CreateEditDelete | Configuration | Create and version KPI definitions | Analyst, Administrators |
| Analytics.Core.AdSpend.CreateEditDelete | Reports | Upload and replace advertising and campaign spend files | Marketing, Administrators |
| Analytics.Core.BiConnection.CreateEditDelete | Configuration | Configure read-only BI and external-system connections and batch report deliveries | Administrators |
| Analytics.Core.OperatorMetrics.View | Reports | See operator metrics of the team | OperationsManager, SupportManager |
| Analytics.Core.OperatorMetrics.ViewOwn | Reports | See own operator metrics | Support, Agent, Warehouse, Finance |
| Analytics.Core.PublicDashboard.CreateEditDelete | ContentManagement | Choose public metrics and publish the public page | Administrators |

Permissions are declared in an RPT plugin class implementing IPermissionConfigManager (pattern: Misc.RFQ RfqPermissionConfigManager). System names use the plugin prefix Analytics.Core and the native view / create-edit-delete split (unchanged in 5.00.1: Libraries/Nop.Services/Security/StandardPermission.cs); Category is taken from the native set. Default roles are given by role system name; every role used here (Analyst, Marketing, OperationsManager, Auditor, Support, SupportManager, Agent, Warehouse, Finance) is in the IAM product role catalogue BR-IAM-050, and the IAM plugin creates catalogue roles that are missing, at install and at start (BR-IAM-050); RPT creates no role and does not rely on native start-up to create one. Native report actions carry two CheckPermission attributes (the report permission and Orders.OrdersView, Catalog.ProductsView or Customers.CustomersView), so a role needs both. Access inside the BI platform (groups, row and field security) is configured in the BI platform (RPT-005), not by nopCommerce permissions. All plugin permission names are Proposed. Source: Libraries/Nop.Services/Security/StandardPermission.cs; Presentation/Nop.Web/Areas/Admin/Controllers/ReportController.cs.

### 4.1 Standard permission criteria

| ID | Criterion | Basis |
|---|---|---|
| AC-RPT-PERM-01 | **Given** a user without Reports.SalesSummary, Reports.CountrySales, Reports.LowStock, Reports.Bestsellers, Reports.ProductsNeverPurchased, Reports.RegisteredCustomers, Reports.CustomersByOrderTotal, Reports.CustomersByNumberOfOrders (native), **when** they open or post any function it guards, **then** access is denied and nothing changes; **given** a user with it, the function is available. | Proposed (T-05) |
| AC-RPT-PERM-02 | **Given** a user without Analytics.Core.StockReports.View, **when** they open or post any function it guards, **then** access is denied and nothing changes; **given** a user with it, the function is available. | Proposed (T-05) |
| AC-RPT-PERM-03 | **Given** a user without Analytics.Core.Extract.CreateEditDelete, **when** they open or post any function it guards, **then** access is denied and nothing changes; **given** a user with it, the function is available. | Proposed (T-05) |
| AC-RPT-PERM-04 | **Given** a user without Analytics.Core.Extract.View, **when** they open or post any function it guards, **then** access is denied and nothing changes; **given** a user with it, the function is available. | Proposed (T-05) |
| AC-RPT-PERM-05 | **Given** a user without Analytics.Core.KpiCatalogue.CreateEditDelete, **when** they open or post any function it guards, **then** access is denied and nothing changes; **given** a user with it, the function is available. | Proposed (T-05) |
| AC-RPT-PERM-06 | **Given** a user without Analytics.Core.AdSpend.CreateEditDelete, **when** they open or post any function it guards, **then** access is denied and nothing changes; **given** a user with it, the function is available. | Proposed (T-05) |
| AC-RPT-PERM-07 | **Given** a user without Analytics.Core.BiConnection.CreateEditDelete, **when** they open or post any function it guards, **then** access is denied and nothing changes; **given** a user with it, the function is available. | Proposed (T-05) |
| AC-RPT-PERM-08 | **Given** a user without Analytics.Core.OperatorMetrics.View, **when** they open or post any function it guards, **then** access is denied and nothing changes; **given** a user with it, the function is available. | Proposed (T-05) |
| AC-RPT-PERM-09 | **Given** a user without Analytics.Core.OperatorMetrics.ViewOwn, **when** they open or post any function it guards, **then** access is denied and nothing changes; **given** a user with it, the function is available. | Proposed (T-05) |
| AC-RPT-PERM-10 | **Given** a user without Analytics.Core.PublicDashboard.CreateEditDelete, **when** they open or post any function it guards, **then** access is denied and nothing changes; **given** a user with it, the function is available. | Proposed (T-05) |

## 5. Source traceability

Traceability of this module to client requirements and catalog features, and requirement coverage, are in the separate traceability document. Each acceptance criterion below names its basis.


## 6. nopCommerce 5.00 baseline and build approach

| PRD ID | Native capability in 5.00.1 | Gap / to build | Code change | Evidence | Confidence |
|---|---|---|---|---|---|
| PRD-RPT-001 | Admin dashboard and reports unchanged; 5.00 adds 'export all' Excel/XML actions for every report (Presentation/Nop.Web/Areas/Admin/Controllers/ReportController.cs, e.g. ExportBestSellersExcelAll). Bestsellers still sorted descending only (Libraries/Nop.Services/Orders/OrderReportService.cs:727-728). | Fast and slow movers report (native Bestsellers sorts descending only: OrderReportService.BestSellersReportAsync) as a plugin admin page reading INV-013 data (IC-INV-06), decision ANL-002-OWN. AFR dashboard panels (PG ADM-01/02) need AFR port if wanted. | Custom plugin | Paths are given in the native-capability column (source tag release-5.00.1) | Verified in 4.90.8 source; re-verified in 5.00.1 source |
| PRD-RPT-002 | Native fixed reports only. Bundled Misc.PowerBI is a stub in 5.00.1 (only plugin class, controller, event consumer and Views/Configure.cshtml linking to nopcommerce.com; plugin.json SupportedVersions 5.00) (Plugins/Nop.Plugin.Misc.PowerBI). | BI platform for KPI definition, executive dashboards, drill-down, self-built dashboards and monthly report; nopCommerce supplies data (DW feed RPT-003 or Power BI plugin). | External system + integration plugin | Paths are given in the native-capability column (source tag release-5.00.1) | Verified in 4.90.8 source; re-verified in 5.00.1 source |
| PRD-RPT-003 | None (no ETL/warehouse). [5.00.1: no change found; 4.90 evidence paths exist in 5.00.1: No ETL component in src] | Data warehouse + ETL (data dictionary, quality checks, anonymisation); nopCommerce exposes DB/API extracts. | External system + integration plugin | Paths are given in the native-capability column (source tag release-5.00.1) | Not found in source — inference: data warehouse is outside an e-commerce application |
| PRD-RPT-004 | Excel/XML export on admin grids (ClosedXML); no scheduled report email, no saved queries. [5.00.1: no change found; 4.90 evidence paths exist in 5.00.1: src/Presentation/Nop.Web/Areas/Admin/Controllers/CustomerController.ExportExcelAll (pattern); PG ADM-04 (NS)] | BI/reporting tool for scheduling, self-service queries, sharing and versioning. PG ADM-04 NopStation SQL manager is a partial in-nop alternative (5.00 support to confirm with vendor). | External system + integration plugin | Paths are given in the native-capability column (source tag release-5.00.1) | Verified in 4.90.8 source; re-verified in 5.00.1 source |
| PRD-RPT-005 | Per-report admin permissions (StandardPermission.Reports.SALES_SUMMARY, LOW_STOCK, BESTSELLERS…) per customer role; no field-level control. [5.00.1: no change found; 4.90 evidence paths exist in 5.00.1: src/Libraries/Nop.Services/Security/StandardPermission.cs (Reports.*)] | Field/row-level security in the BI platform for RPT-002/003 reports. | External system + integration plugin | Paths are given in the native-capability column (source tag release-5.00.1) | Verified in 4.90.8 source; re-verified in 5.00.1 source |
| PRD-RPT-006 | ActivityLog (who/what/when, no old/new values) viewable in admin; no access log of data views. [5.00.1: no change found; 4.90 evidence paths exist in 5.00.1: src/Libraries/Nop.Core/Domain/Logging/ActivityLog.cs; src/Presentation/Nop.Web/Areas/Admin/Controllers/ActivityLogController.cs] | Regulator/audit reports in BI over the SEC-004 audit store. | External system + integration plugin | Paths are given in the native-capability column (source tag release-5.00.1) | Verified in 4.90.8 source; re-verified in 5.00.1 source |
| PRD-RPT-007 | None (no public statistics page). [5.00.1: no change found; 4.90 evidence paths exist in 5.00.1: No public stats controller in src/Presentation/Nop.Web/Controllers] | Public page (custom plugin + route) showing anonymised aggregate figures, cached. | Custom plugin | Paths are given in the native-capability column (source tag release-5.00.1) | Not found in source — inference: no such controller found |
| PRD-RPT-008 | Bundled Misc.PowerBI is a stub in 5.00.1 (only plugin class, controller, event consumer and Views/Configure.cshtml linking to nopcommerce.com; plugin.json SupportedVersions 5.00); no data connector code (Plugins/Nop.Plugin.Misc.PowerBI/PowerBIPlugin.cs, Views/Configure.cshtml). | Official nopCommerce Power BI plugin (paid) or BI reading the DW (RPT-003). The 5.00 stub confirms only that nopCommerce markets the paid plugin for 5.00; build, licence and scope are V-01 items. | None | Paths are given in the native-capability column (source tag release-5.00.1) | Verified in 4.90.8 source; re-verified in 5.00.1 source |
| PRD-RPT-009 | ActivityLog by customer; no queue/SLA data. [5.00.1: no change found; 4.90 evidence paths exist in 5.00.1: src/Libraries/Nop.Core/Domain/Logging/ActivityLog.cs] | Operator metrics from work-queue events (ADM-007) and SLA targets. | Custom plugin | Paths are given in the native-capability column (source tag release-5.00.1) | Verified in 4.90.8 source; re-verified in 5.00.1 source |
| PRD-RPT-010 | Native dashboard/reports only. [5.00.1: no change found; 4.90 evidence paths exist in 5.00.1: src/Presentation/Nop.Web/Areas/Admin/Controllers/HomeController.cs] | Operational dashboards in BI fed by DW (delivery, payments, sellers, fraud, case load, SLA). | External system + integration plugin | Paths are given in the native-capability column (source tag release-5.00.1) | Verified in 4.90.8 source; re-verified in 5.00.1 source |
| PRD-RPT-011 | GA4 e-commerce events (GoogleAnalyticsSettings.EnableEcommerce); native reports only. [5.00.1: no change found; 4.90 evidence paths exist in 5.00.1: src/Plugins/Nop.Plugin.Widgets.GoogleAnalytics/GoogleAnalyticsSettings.cs] | BI analytics (cost, cohorts, campaigns, segments, trends) over DW. Scope: Import of advertising and campaign spend (sources to be confirmed with the client). | External system + integration plugin | Paths are given in the native-capability column (source tag release-5.00.1) | Verified in 4.90.8 source; re-verified in 5.00.1 source |
| PRD-RPT-012 | None. [5.00.1: no change found; 4.90 evidence paths exist in 5.00.1: No e-government entities in src/Libraries/Nop.Core/Domain] | BI reports on e-government usage by agency and engagement, fed by EGV data in DW. | External system + integration plugin | Paths are given in the native-capability column (source tag release-5.00.1) | Not found in source — inference: depends on EGV custom modules and BI |


## 7. Feature specifications


### 7.1 PRD-RPT-001 Standard reports and dashboard

| Item | Value |
|---|---|
| Description (baseline) | Ready-made reports and a home dashboard for staff: sales summary, best sellers, low stock, products never sold, sales by country and customer reports. |
| Why it matters | Basic business information from day one. |
| Who benefits | Management; staff |
| Phase | P1 |
| Implementation | Code-level — Custom plugin |
| Depends on | — |
| Status | Ready; conditions: ANL-002-OWN |

**User stories**

| ID | Story | Basis | Readiness |
|---|---|---|---|
| US-RPT-001-01 | As a manager, I want a home dashboard with order and customer figures, in text and charts, so that I see the state of the business when I sign in. | D; REQ-KTDA-ANL-001; REQ-MPC-RPT-001 | Ready; conditions: ANL-002-OWN |
| US-RPT-001-02 | As a manager, I want reports on actual sales, fast and slow movers, products never sold and stock levels, so that I see sales performance and stock at a glance. | D; REQ-KTDA-ANL-002; ANL-002-OWN | Ready; conditions: ANL-002-OWN |
| US-RPT-001-03 | As a manager, I want sales by country and customer reports, so that I know where sales come from and who the best customers are. | D | Ready; conditions: ANL-002-OWN |
| US-RPT-001-04 | As a client administrator, I want to give each role only the reports it needs, so that report data stays with the right people. | FIT | Ready; conditions: ANL-002-OWN |

**Acceptance criteria**

| ID | Story | Criterion | Basis |
|---|---|---|---|
| AC-RPT-001-01-01 | US-RPT-001-01 | **Given** a user may access the admin area, **when** they open the admin home page, **then** the native dashboard shows common statistics, order and customer statistics charts, latest orders, popular search terms, bestsellers by quantity and by amount, incomplete orders and order averages, each card only if the user holds its native permission. | FIT (Admin HomeController); REQ-KTDA-ANL-001; REQ-MPC-RPT-001 |
| AC-RPT-001-01-02 | US-RPT-001-01 | **Given** a product plugin needs a dashboard panel, **when** the plugin registers a widget for an admin dashboard widget zone (for example admin_dashboard_top), **then** the panel is shown on the dashboard without changing native views. | FIT (AdminWidgetZones.Dashboard*); Proposed |
| AC-RPT-001-02-01 | US-RPT-001-02 | **Given** orders exist in the period, **when** the user runs Sales summary grouped by day, week or month with order and payment status filters, **then** sales totals per group are shown (actual sales). | FIT (ReportController.SalesSummary; GroupByOptions Day, Week, Month); REQ-KTDA-ANL-002 |
| AC-RPT-001-02-02 | US-RPT-001-02 | **Given** orders exist in the period, **when** the user runs Bestsellers sorted by quantity or amount, **then** products are ranked, giving the fast movers. | FIT (ReportController.Bestsellers); REQ-KTDA-ANL-002 |
| AC-RPT-001-02-03 | US-RPT-001-02 | **Given** products exist, **when** the user runs Products never purchased for a period, **then** products with no sales in the period are listed. | FIT (ReportController.NeverSold); REQ-KTDA-ANL-002 |
| AC-RPT-001-02-04 | US-RPT-001-02 | **Given** products with managed stock exist, **when** the user runs Low stock, **then** products whose stock is at or below their minimum stock quantity are listed with their stock level. | FIT (ProductService.GetLowStockProductsAsync; Product.MinStockQuantity); REQ-KTDA-ANL-002 |
| AC-RPT-001-02-05 | US-RPT-001-02 | **Given** orders exist in the period and INV-013 exposes stock-movement data through IC-INV-06 GetStockMovementData (daily sellable-stock snapshots, movements by reason, current sellable stock per product and warehouse), **when** a user with Analytics.Core.StockReports.View runs the Fast and slow movers report for a period, **then** products are listed with units sold in the period (order lines of orders placed in the period, cancelled orders excluded, as in BR-INV-100), current sellable stock per warehouse from IC-INV-06 and days of cover by the INV-013 formula (sellable stock / average units sold per day, blank when nothing was sold), and can be sorted ascending (slow movers) or descending (fast movers) by units sold; products with no sales in the period are included with zero; the report reads INV-013 data only and changes no stock (decision ANL-002-OWN). | REQ-KTDA-ANL-002; ANL-002-OWN; FIT (5.00.1: native Bestsellers still sorts only descending, Libraries/Nop.Services/Orders/OrderReportService.cs:727-728) |
| AC-RPT-001-02-06 | US-RPT-001-02 | **Given** a user lacks Analytics.Core.StockReports.View, **when** they call the Fast and slow movers report, **then** access is denied and no data is shown. | Proposed |
| AC-RPT-001-03-01 | US-RPT-001-03 | **Given** orders and customers exist, **when** the user runs Country sales, Registered customers, Best customers by order total or by number of orders, **then** the native report is shown for the period chosen. | FIT (ReportController) |
| AC-RPT-001-04-01 | US-RPT-001-04 | **Given** a role holds Reports.Bestsellers but not Orders.OrdersView, **when** a user of that role opens Bestsellers, **then** access is denied, because the native action requires both permissions. | FIT (CheckPermission attributes on ReportController) |
| AC-RPT-001-03-02 | US-RPT-001-03 | **Given** a user holds the native permission of a report (for example Reports.Bestsellers with Orders.OrdersView), **when** they choose export all to Excel or to XML on that report page (sales summary, low stock, bestsellers, never sold, country sales, registered customers, best customers by order total or by number of orders), **then** the file holds every row of the report for the filters set, through the native IExportManager report exports, with the SEC-014 masking where SEC-014 is delivered; a user without the permission is refused. | VER-500; REQ-KTDA-ANL-002; FIT (5.00.1: Presentation/Nop.Web/Areas/Admin/Controllers/ReportController.cs:119-976, e.g. ExportBestSellersExcelAll :425-429 with [CheckPermission] for Orders.OrdersView and Reports.Bestsellers; Libraries/Nop.Services/ExportImport/IExportManager.cs) |

**Business rules applied:** BR-RPT-001; BR-RPT-060 (§8.1).


### 7.2 PRD-RPT-002 KPI framework and executive dashboards

| Item | Value |
|---|---|
| Description (baseline) | The client defines the key measures it wants to track (such as sales, orders and conversion), sees them on executive dashboards, clicks through to the detail, builds its own dashboards and gets a monthly operations report template filled in automatically. |
| Why it matters | Leaders see business performance at a glance. |
| Who benefits | Management |
| Phase | P1 |
| Implementation | External system — External system + integration plugin |
| Depends on | PRD-RPT-003 |
| Status | On hold: PAID-STUB |

**User stories**

| ID | Story | Basis | Readiness |
|---|---|---|---|
| US-RPT-002-01 | As a manager, I want executive dashboards for registrations, active buyers and sellers, gross merchandise value (GMV), orders and conversion rate, so that leaders see business performance at a glance. | D; REQ-MPC-FR-276; REQ-MPC-RPT-001; FC-M19-008 | On hold: PAID-STUB |
| US-RPT-002-02 | As an analyst, I want to define further KPIs and their formulas without code, so that new measures are added by configuration. | D; REQ-MPC-FR-288 | On hold: PAID-STUB |
| US-RPT-002-03 | As a manager, I want a monthly operations report template filled in automatically from system figures, so that the monthly report needs no manual collection. | D; REQ-MPC-FR-296 | On hold: PAID-STUB |
| US-RPT-002-04 | As a manager, I want to click from any KPI down to the records behind it, so that I can find the cause of a change. | D; FC-M19-013 | On hold: PAID-STUB |
| US-RPT-002-05 | As an analyst, I want to build my own dashboards from catalogue KPIs and share them, so that teams get the views they need. | D; FC-M19-006 | On hold: PAID-STUB |

**Acceptance criteria**

| ID | Story | Criterion | Basis |
|---|---|---|---|
| AC-RPT-002-01-01 | US-RPT-002-01 | **Given** the BI platform reads the data warehouse (RPT-003) or the licensed Power BI plugin is installed (PAID-STUB), **when** a manager opens the executive dashboard for a period, **then** registrations, active buyers, active sellers, GMV, orders and conversion rate are shown, each computed by its KPI catalogue definition (BR-RPT-010). | REQ-MPC-FR-276 |
| AC-RPT-002-01-02 | US-RPT-002-01 | **Given** the conversion-rate KPI needs visit counts, **when** the dashboard is built, **then** visits come from Google Analytics 4 data (MKT-010) loaded into the warehouse; nopCommerce stores no visit counts; if that source is not connected the KPI is shown as not available. | REQ-MPC-FR-276; Inference (no visit store in nopCommerce; GoogleAnalyticsSettings.EnableEcommerce sends events to GA4) |
| AC-RPT-002-01-03 | US-RPT-002-01 | **Given** active KPI definitions exist (BR-RPT-010), **when** a manager opens the executive dashboard for a period, **then** each KPI is shown both as text (value with its unit, period and code) and as a graphic (a chart of the KPI over the period); the same values can be exported as a table (RPT-004). | REQ-MPC-RPT-001 |
| AC-RPT-002-01-04 | US-RPT-002-01 | **Given** a dashboard or report groups figures by financial year, quarter or month, **when** the periods are computed, **then** when PLT-012 (P2) is delivered they come from the PLT-012 fiscal-calendar service (FiscalCalendarSettings, client layer); until then (P1) the financial year is the calendar year and quarters and months are calendar periods, and the report states that calendar periods are used (BR-RPT-012). | Proposed (P1 fallback; AC-PLT-012-01-01) |
| AC-RPT-002-02-01 | US-RPT-002-02 | **Given** the logistics KPI definitions of BR-LOG-120 (on-time rate, delivery success rate and the others listed there, all Proposed) exist, **when** the Logistics and postal pack is applied, **then** they are loaded into the KPI catalogue as Draft entries with code, formula and owner LOG-018, and once activated they are the only definitions used by RPT-010 and by the LOG-018 dashboard (BR-RPT-010). | Proposed (LOG-018) |
| AC-RPT-002-02-02 | US-RPT-002-02 | **Given** a user has Analytics.Core.KpiCatalogue.CreateEditDelete, **when** they create a KPI with code, name, description, formula over data-dictionary fields, unit, owner and optional target, **then** the definition is stored as Draft, checked against the data dictionary (unknown fields refused with message Rpt.KpiFormulaInvalid), and when activated (SM-RPT-03) it is exported to the BI platform through IC-RPT-03 without code change. | REQ-MPC-FR-288 |
| AC-RPT-002-02-03 | US-RPT-002-02 | **Given** an active KPI is changed, **when** the new version is saved with an effective date, **then** the old version stays for earlier periods and the change is audited (AUD-RPT-003). | REQ-MPC-FR-288; Proposed |
| AC-RPT-002-03-01 | US-RPT-002-03 | **Given** the monthly template (sections and KPIs, content not stated) is configured in the BI platform, **when** a month ends, **then** the report for that month is generated from the KPI values and delivered as configured (RPT-004). | REQ-MPC-FR-296 |
| AC-RPT-002-04-01 | US-RPT-002-04 | **Given** a KPI is shown, **when** the user drills down, **then** the BI platform moves through the configured dimensions (for example store, category, seller, region) to the record list; each order record links to its nopCommerce admin order page by ID. | FC-M19-013 |
| AC-RPT-002-05-01 | US-RPT-002-05 | **Given** a user has author rights in the BI platform, **when** they compose a dashboard from catalogue KPIs and share it with a BI group, **then** members of that group see it; others do not (RPT-005). | FC-M19-006 |

**Business rules applied:** BR-RPT-010; BR-RPT-012 (§8.1).


### 7.3 PRD-RPT-003 Data warehouse and ETL

| Item | Value |
|---|---|
| Description (baseline) | A separate reporting database that collects and cleans data from the shop and other systems, with a data dictionary, quality checks and anonymisation, ready for analytics and AI tools. |
| Why it matters | Reliable data for analysis without slowing down the shop. |
| Who benefits | Analysts; management |
| Phase | P1 |
| Implementation | External system — External system + integration plugin |
| Depends on | — |
| Status | Ready; conditions: CFG-01 |

**User stories**

| ID | Story | Basis | Readiness |
|---|---|---|---|
| US-RPT-003-01 | As an analyst, I want a separate reporting database fed from the shop and the other systems by an ETL process, so that analysis does not slow down the shop. | D; REQ-MPC-FR-282; REQ-MPC-ARC-001 | Ready; conditions: CFG-01 |
| US-RPT-003-02 | As an analyst, I want help-desk and customer-service data in the warehouse, so that service performance can be analysed with sales. | REQ-MPC-FR-275 | Ready; conditions: CFG-01 |
| US-RPT-003-03 | As an analyst, I want a data dictionary of every reporting field, so that everyone reads the data the same way. | D; REQ-MPC-FR-286 | Ready; conditions: CFG-01 |
| US-RPT-003-04 | As an analyst, I want data-quality checks with a report of issues, so that we trust the figures. | D; REQ-MPC-FR-291 | Ready; conditions: CFG-01 |
| US-RPT-003-05 | As a client administrator, I want personal data pseudonymised or removed before analytics when policy requires, so that analytics respects data protection. | D; REQ-MPC-FR-293 | Ready; conditions: CFG-01 |
| US-RPT-003-06 | As a KTDA analyst, I want the warehouse data available to KTDA's AI and advanced analytics platforms, so that KTDA can use advanced analytics. | D; REQ-KTDA-ANL-007 | Ready; conditions: CFG-01 |

**Acceptance criteria**

| ID | Story | Criterion | Basis |
|---|---|---|---|
| AC-RPT-003-01-01 | US-RPT-003-01 | **Given** an extract dataset is configured (tables, mode, schedule — schedule not stated), **when** its run starts, **then** the RPT export task reads the changes since the last successful watermark and writes files with a manifest (dataset, row count, checksum) to the warehouse staging area through IC-RPT-01; the run follows SM-RPT-01 and is recorded. | REQ-MPC-FR-282 |
| AC-RPT-003-01-02 | US-RPT-003-01 | **Given** a dataset is based on a native table without an update timestamp (for example Order, OrderItem, Customer and Shipment have no UpdatedOnUtc), **when** the dataset is configured, **then** its mode is ChangeFeed, reading the change records of the SEC-004 audit trail through IC-SEC-01 QueryAsync with the entity name and the filter sequence greater than the last successful watermark (paged; the last sequence number of the run becomes the new watermark), or Full extraction on each run; insert-only tables may use the Id range (BR-RPT-020). | FIT (no UpdatedOnUtc on Order, OrderItem, Customer, Shipment); Proposed |
| AC-RPT-003-01-03 | US-RPT-003-01 | **Given** a run fails, **when** the error is recorded, **then** the run becomes Failed, is retried per the retry setting (default not stated), administrators are notified, and the next run restarts from the last successful watermark. | Proposed |
| AC-RPT-003-01-04 | US-RPT-003-01 | **Given** the shop database has a read replica (hosting), **when** extracts run, **then** they read from the replica, not the primary database; without a replica they run in the configured off-peak window (setting, default not stated). | REQ-MPC-ARC-001; D (without slowing down the shop) |
| AC-RPT-003-02-01 | US-RPT-003-02 | **Given** the help desk is active, **when** the CRM datasets are configured (tickets and their extension, ratings, fraud referrals, call logs), **then** they are extracted like other datasets; data held in the licensed help-desk plugin is read only through the CRM read-only extract views (IC-CRM-05 GetExtractViews), never from the plugin tables directly. | REQ-MPC-FR-275 |
| AC-RPT-003-03-01 | US-RPT-003-03 | **Given** datasets are configured, **when** the data dictionary is generated, **then** every extracted field is listed with name, type, description, source table and column, and personal-data class, and is published with each manifest. | REQ-MPC-FR-286 |
| AC-RPT-003-04-01 | US-RPT-003-04 | **Given** quality rules for missing values, duplicates and invalid statuses are defined per dataset in the pipeline (external), **when** a load runs, **then** violations are written to a data-quality report with counts and sample keys; a dataset whose blocking rule fails is not loaded and the data owner is notified. | REQ-MPC-FR-291 |
| AC-RPT-003-05-01 | US-RPT-003-05 | **Given** a dataset field is marked for pseudonymisation or removal (setting per field), **when** the extract runs, **then** the field is replaced by a keyed hash (key held only in the client instance, never exported) or removed before the file leaves nopCommerce; the manifest lists the fields treated. | REQ-MPC-FR-293; CFG-01 |
| AC-RPT-003-06-01 | US-RPT-003-06 | **Given** KTDA names its AI or analytics platform (KG-17), **when** that platform is given a read-only warehouse account, **then** it reads the warehouse data views with the same pseudonymisation as other consumers. | REQ-KTDA-ANL-007 |

**Business rules applied:** BR-RPT-020; BR-RPT-021 (§8.1).


### 7.4 PRD-RPT-004 Report delivery and self-service

| Item | Value |
|---|---|
| Description (baseline) | Reports can be scheduled and emailed, exported in several formats, and built by staff themselves with simple queries. Saved queries and analyses can be shared, commented on and versioned, including saved database reports with parameters. |
| Why it matters | Staff get the reports they need without developers. |
| Who benefits | Staff; analysts |
| Phase | P1 |
| Implementation | External system — External system + integration plugin |
| Depends on | — |
| Status | Ready |

**User stories**

| ID | Story | Basis | Readiness |
|---|---|---|---|
| US-RPT-004-01 | As a member of staff, I want reports scheduled and e-mailed to named recipients, so that I receive reports without asking. | D; REQ-MPC-FR-284; FC-M19-002 | Ready |
| US-RPT-004-02 | As an analyst, I want ad-hoc queries and exports on defined data views, so that I answer questions without developers. | D; REQ-MPC-FR-285 | Ready |
| US-RPT-004-03 | As a member of staff, I want reports exported in several formats, so that I can share and analyse them. | D; FC-M19-003 | Ready |
| US-RPT-004-04 | As a client administrator, I want report data shared with other government or Malawi Post systems by API or batch file, as authorised, so that other systems get what they are allowed to. | REQ-MPC-FR-289 | Ready |
| US-RPT-004-05 | As an analyst, I want to save, share, comment on and version queries and analyses, so that work is reused, not repeated. | D; FC-M19-007 | Ready |

**Acceptance criteria**

| ID | Story | Criterion | Basis |
|---|---|---|---|
| AC-RPT-004-01-01 | US-RPT-004-01 | **Given** a report schedule (frequency, recipients, format) is set in the BI platform, **when** the schedule time comes, **then** the report is e-mailed to each recipient as an attachment or link; a failed delivery is logged. | REQ-MPC-FR-284 |
| AC-RPT-004-01-02 | US-RPT-004-01 | **Given** a recipient is not authorised for the report (RPT-005), **when** the schedule is saved, **then** the recipient is refused. | Proposed |
| AC-RPT-004-02-01 | US-RPT-004-02 | **Given** an analyst belongs to the analyst group of the BI platform, **when** they query the defined data views and export the result, **then** the query runs on the warehouse views only, never on the shop database tables, and the result exports to Excel or CSV. | REQ-MPC-FR-285 |
| AC-RPT-004-02-02 | US-RPT-004-02 | **Given** the client uses the NopStation SQL manager instead (Post Gebeya ADM-04, V-01), **when** it is configured, **then** it connects with a read-only database user limited to the defined views. | Proposed; FIT (PG ADM-04) |
| AC-RPT-004-03-01 | US-RPT-004-03 | **Given** a report is open in the BI platform, **when** the user exports it, **then** PDF, Excel and CSV are offered, and image export for charts; native admin lists (orders, customers, products) and, since 5.00, the native report pages keep their native Excel and XML export. | D; FC-M19-003; FIT (5.00.1: OrderController.ExportExcelAll, ExportXmlAll; ReportController Export*ExcelAll, Export*XmlAll, Presentation/Nop.Web/Areas/Admin/Controllers/ReportController.cs:119-976) |
| AC-RPT-004-04-01 | US-RPT-004-04 | **Given** an external system is registered with credentials and the datasets it may receive (Analytics.Core.BiConnection.CreateEditDelete), **when** a batch delivery is due, or the system calls the report API (INT-001), **then** only the datasets authorised for that API client are delivered (file with manifest, or API response); batch files go through the INT-004 message log with its retry; each delivery is audited (AUD-RPT-008). | REQ-MPC-FR-289 |
| AC-RPT-004-05-01 | US-RPT-004-05 | **Given** an analyst saves a query in the BI platform, **when** they share it and others comment, **then** the query keeps a version history and the comments are stored with it. | D; FC-M19-007 |

**Business rules applied:** BR-RPT-030 (§8.1).


### 7.5 PRD-RPT-005 Report access control

| Item | Value |
|---|---|
| Description (baseline) | Controls who can see which reports and which fields in them. |
| Why it matters | Sensitive data in reports stays protected. |
| Who benefits | Management; auditors |
| Phase | P1 |
| Implementation | External system — External system + integration plugin |
| Depends on | — |
| Status | Ready |

**User stories**

| ID | Story | Basis | Readiness |
|---|---|---|---|
| US-RPT-005-01 | As a client administrator, I want to control who sees which reports and dashboards, and which fields in them, so that sensitive data in reports stays protected. | D; REQ-MPC-FR-283 | Ready |

**Acceptance criteria**

| ID | Story | Criterion | Basis |
|---|---|---|---|
| AC-RPT-005-01-01 | US-RPT-005-01 | **Given** native reports are in use, **when** a role is given or refused a Reports permission, **then** only roles holding it see and open that report (native). | REQ-MPC-FR-283; FIT (StandardPermission.Reports) |
| AC-RPT-005-01-02 | US-RPT-005-01 | **Given** BI groups are mapped to client roles, **when** a user without a group membership for a dashboard opens it, **then** access is denied and no data is shown. | REQ-MPC-FR-283 |
| AC-RPT-005-01-03 | US-RPT-005-01 | **Given** fields have a personal-data or sensitive class in the data dictionary, **when** a user whose group lacks the sensitive-data right opens a report with such fields, **then** those fields are hidden or masked by the BI field-level security. | REQ-MPC-FR-283 |
| AC-RPT-005-01-04 | US-RPT-005-01 | **Given** row-level rules limit groups to a store, seller or region (Proposed), **when** a limited user opens a report, **then** only rows in their scope are shown. | Proposed |
| AC-RPT-005-01-05 | US-RPT-005-01 | **Given** a role-to-group mapping changes, **when** it is saved, **then** the change is recorded in the BI platform log. | Proposed |

**Business rules applied:** BR-RPT-030 (§8.1).


### 7.6 PRD-RPT-006 Compliance and audit reports

| Item | Value |
|---|---|
| Description (baseline) | Reports for regulators and auditors, including who accessed what and what was changed. |
| Why it matters | Supports audits and regulatory reporting. |
| Who benefits | Compliance staff; auditors |
| Phase | P1 |
| Implementation | External system — External system + integration plugin |
| Depends on | — |
| Status | Ready |

**User stories**

| ID | Story | Basis | Readiness |
|---|---|---|---|
| US-RPT-006-01 | As an auditor, I want reports of logins, admin actions and configuration changes, so that security and compliance can be monitored. | D; REQ-MPC-FR-287 | Ready |
| US-RPT-006-02 | As a member of compliance staff, I want regulatory and compliance reports on complaints, AML/CFT flags and privacy requests, so that we meet reporting duties. | D; REQ-MPC-FR-292 | Ready |
| US-RPT-006-03 | As an auditor, I want to see who accessed which records, so that access can be reviewed. | D | Ready |

**Acceptance criteria**

| ID | Story | Criterion | Basis |
|---|---|---|---|
| AC-RPT-006-01-01 | US-RPT-006-01 | **Given** an auditor holds the permission of the SEC-004 compliance report, **when** they open Reports, Compliance in the RPT report menu, **then** the menu entry opens the SEC-004 compliance report of logins, admin actions and configuration changes (AC-SEC-004-05-01); RPT builds no second report of the same content. | see SEC-004 (REQ-MPC-FR-287); Proposed (one owner) |
| AC-RPT-006-01-02 | US-RPT-006-01 | **Given** the SEC-004 audit store is read through IC-SEC-01 QueryAsync or its signed exports and loaded to the warehouse, **when** a BI analyst builds a dashboard on audit data, **then** the warehouse holds the audit events with user, entity, time and before and after values for BI use; the compliance report itself is SEC-004 (see SEC-004 (REQ-MPC-FR-287)). | Proposed |
| AC-RPT-006-02-01 | US-RPT-006-02 | **Given** complaint tickets (CRM-004), risk flags (PAY-018), fraud referrals (CRM-010) and privacy requests (IAM-017, SEC-012) are in the warehouse, **when** the compliance report runs for a period, **then** counts, statuses and handling times are shown per category. | REQ-MPC-FR-292 |
| AC-RPT-006-02-02 | US-RPT-006-02 | **Given** a regulator format is defined (not stated), **when** the report is produced for that regulator, **then** it follows that format. | REQ-MPC-FR-292 |
| AC-RPT-006-03-01 | US-RPT-006-03 | **Given** staff read access to customer personal data (customer edit, order edit and customer address pages) is recorded as AUD-IAM-010 by the IAM filter (BR-IAM-080) and stored in the SEC-004 audit store, **when** the auditor runs the access report for a period, read through IC-SEC-01 QueryAsync (event AUD-IAM-010), **then** who viewed which customer and order records, and when, is listed with staff user, customer and page. | D; Proposed (BR-IAM-080; SEC-004) |

**Business rules applied:** none specific to this feature (§8.1 lists the module rules).


### 7.7 PRD-RPT-007 Public transparency dashboard

| Item | Value |
|---|---|
| Description (baseline) | A public web page with anonymised figures about the platform's activity. |
| Why it matters | Transparency for public programmes. |
| Who benefits | The public; funders |
| Phase | P3 |
| Implementation | Code-level — Custom plugin |
| Depends on | — |
| Status | Ready |

**User stories**

| ID | Story | Basis | Readiness |
|---|---|---|---|
| US-RPT-007-01 | As a member of the public, I want to see anonymised figures about the platform's activity without signing in, so that I can see what the programme delivers. | D; FC-M19-010 | Ready |

**Acceptance criteria**

| ID | Story | Criterion | Basis |
|---|---|---|---|
| AC-RPT-007-01-01 | US-RPT-007-01 | **Given** public metrics are selected and the page is published (Analytics.Core.PublicDashboard.CreateEditDelete), **when** a visitor opens the public page, **then** aggregate figures are shown from the latest snapshot, refreshed on the configured schedule (default not stated). | D |
| AC-RPT-007-01-02 | US-RPT-007-01 | **Given** a figure would come from fewer records than the minimum group size (setting, default not stated), **when** the snapshot is built, **then** the figure is suppressed and message Rpt.SuppressedSmallGroup is shown in its place. | Proposed |
| AC-RPT-007-01-03 | US-RPT-007-01 | **Given** a metric would expose a field classed as personal data in the data dictionary, **when** the administrator selects it, **then** the selection is refused. | D (anonymised); Proposed |

**Business rules applied:** BR-RPT-040 (§8.1).


### 7.8 PRD-RPT-008 External BI connectivity

| Item | Value |
|---|---|
| Description (baseline) | Lets the client's own business-intelligence tools (such as Power BI) connect to the reporting data. |
| Why it matters | The client analyses data in tools it already uses. |
| Who benefits | Analysts |
| Phase | P2 |
| Implementation | Licensed plugin — None |
| Depends on | — |
| Status | On hold: PAID-STUB |

**User stories**

| ID | Story | Basis | Readiness |
|---|---|---|---|
| US-RPT-008-01 | As an analyst, I want to connect the client's own BI tool, such as Power BI, to the reporting data, so that we analyse data in tools we already use. | D; FC-M19-014 | On hold: PAID-STUB |

**Acceptance criteria**

| ID | Story | Criterion | Basis |
|---|---|---|---|
| AC-RPT-008-01-01 | US-RPT-008-01 | **Given** the official nopCommerce Power BI plugin is licensed and installed (PAID-STUB, V-01), **when** it is configured, **then** the reports delivered by the plugin are listed in the client's Power BI workspace and show data of the configured store; which reports the licensed plugin contains (the stub names 13) is confirmed under V-01. | FIT (5.00.1: Misc.PowerBI stub — plugin class, controller, event consumer and a configuration view linking to nopcommerce.com — plugin.json SupportedVersions 5.00) |
| AC-RPT-008-01-02 | US-RPT-008-01 | **Given** the client uses its own BI tool on the warehouse instead, **when** the connection is configured (Analytics.Core.BiConnection.CreateEditDelete), **then** the tool connects read-only to the warehouse views by the method the warehouse offers (for example direct database, OData or JDBC), per the security policy. | FC-M19-014; D |
| AC-RPT-008-01-03 | US-RPT-008-01 | **Given** any BI connection is configured, **when** credentials are saved, **then** they are stored encrypted in the client instance, never in a configuration pack, and no connection has write rights to the shop database. | CFG-01; Proposed |
| AC-RPT-008-01-04 | US-RPT-008-01 | **Given** only the bundled Misc.PowerBI plugin is installed, **when** the administrator opens its configuration, **then** it shows a link to the paid plugin and no data connection exists. | FIT (5.00.1: Plugins/Nop.Plugin.Misc.PowerBI/Views/Configure.cshtml) |

**Business rules applied:** BR-RPT-030 (§8.1).


### 7.9 PRD-RPT-009 Operator performance metrics

| Item | Value |
|---|---|
| Description (baseline) | Measures the productivity of each staff member or team and whether they meet service-level targets. |
| Why it matters | Managers see where teams need support. |
| Who benefits | Operations managers |
| Phase | P2 |
| Implementation | Code-level — Custom plugin |
| Depends on | — |
| Status | Ready |

**User stories**

| ID | Story | Basis | Readiness |
|---|---|---|---|
| US-RPT-009-01 | As an operations manager, I want the productivity, quality and service-level adherence of each staff member and team, so that I see where teams need support. | D; FC-M04-029 | Ready |

**Acceptance criteria**

| ID | Story | Criterion | Basis |
|---|---|---|---|
| AC-RPT-009-01-01 | US-RPT-009-01 | **Given** work-queue items (ADM-007), tickets (CRM), returns and cases (RET) record their assignee, **when** the manager opens operator metrics for a period, **then** items handled per operator and per team are shown. | FC-M04-029 |
| AC-RPT-009-01-02 | US-RPT-009-01 | **Given** SLA timers exist for the operator's items (CRM-014), **when** the metrics are shown, **then** the share of timers Met and Breached per operator is shown. | FC-M04-029 |
| AC-RPT-009-01-03 | US-RPT-009-01 | **Given** the rework and dispute-rate definitions are configured (definitions not stated), **when** the metrics are shown, **then** rework rate and dispute rate per operator are shown by those definitions. | FC-M04-029 |
| AC-RPT-009-01-04 | US-RPT-009-01 | **Given** a user has Analytics.Core.OperatorMetrics.ViewOwn only, **when** they open operator metrics, **then** they see their own figures only. | Proposed |

**Business rules applied:** none specific to this feature (§8.1 lists the module rules).


### 7.10 PRD-RPT-010 Operational dashboards

| Item | Value |
|---|---|
| Description (baseline) | Day-to-day dashboards for delivery, payments, seller performance and fraud. It also gives operations teams case-load, throughput, exception-rate and service-level dashboards, the complaint backlog and scheme review queues. |
| Why it matters | Operational teams spot problems as they happen. |
| Who benefits | Operations, finance and fraud staff |
| Phase | P1 |
| Implementation | External system — External system + integration plugin |
| Depends on | PRD-RPT-002 |
| Status | On hold: PAID-STUB |

**User stories**

| ID | Story | Basis | Readiness |
|---|---|---|---|
| US-RPT-010-01 | As an operations manager, I want order and logistics performance reports by outlet, hub, user and service, so that delivery problems are seen early. | REQ-MPC-FR-277 | On hold: PAID-STUB |
| US-RPT-010-02 | As a member of finance staff, I want payments reports by payment method, so that payment problems are seen early. | REQ-MPC-FR-278 | On hold: PAID-STUB |
| US-RPT-010-03 | As a marketplace manager, I want seller performance reports with export, so that seller problems are seen and acted on. | REQ-MPC-FR-279 | On hold: PAID-STUB |
| US-RPT-010-04 | As a member of fraud staff, I want fraud and risk analytics, so that fraud patterns are seen. | REQ-MPC-FR-280 | On hold: PAID-STUB |
| US-RPT-010-05 | As an operations manager, I want case-load, throughput, exception-rate and service-level dashboards, the complaint backlog and scheme review queues, so that teams spot problems as they happen. | D; FC-M19-009; FC-M04-030 | On hold: PAID-STUB |

**Acceptance criteria**

| ID | Story | Criterion | Basis |
|---|---|---|---|
| AC-RPT-010-01-01 | US-RPT-010-01 | **Given** shipment and tracking data are in the warehouse, **when** the logistics report runs for a period, **then** on-time delivery rate, delivery success rate and average transit time are shown by outlet, hub, user and service, using the KPI catalogue definitions shared with LOG-018. | REQ-MPC-FR-277 |
| AC-RPT-010-02-01 | US-RPT-010-02 | **Given** PAY transactions, refunds and reconciliation lines are in the warehouse, **when** the payments report runs, **then** payment success rate, method mix (count and amount), reconciliation exceptions by class and refunds by status are shown per payment method. | REQ-MPC-FR-278 |
| AC-RPT-010-03-01 | US-RPT-010-03 | **Given** seller orders, cancellations, returns (RET) and seller ratings (SEL-012) are in the warehouse, **when** the seller report runs, **then** fulfilment SLA adherence, cancellations, returns rate and ratings are shown per seller and can be exported to Excel or CSV. | REQ-MPC-FR-279 |
| AC-RPT-010-04-01 | US-RPT-010-04 | **Given** risk flags (PAY-018) and fraud referrals (CRM-010) are in the warehouse, **when** the fraud report runs, **then** flagged transactions, triggers per rule and referral outcomes are shown for the period. | REQ-MPC-FR-280 |
| AC-RPT-010-05-01 | US-RPT-010-05 | **Given** queue, ticket, case and timer data are in the warehouse, **when** the operations dashboard refreshes (refresh interval setting, default not stated), **then** open case-load, throughput, exception rate and SLA compliance per queue, the complaint backlog, average post-resolution rating (CRM-005 ratings) and, where the schemes pack is active, scheme review queues are shown; ticket, timer, rating and fraud-referral data come from the CRM extract views (IC-CRM-05) and RET case data. | D; FC-M19-009; Proposed |

**Business rules applied:** BR-RPT-010 (§8.1).


### 7.11 PRD-RPT-011 Commerce and marketing analytics

| Item | Value |
|---|---|
| Description (baseline) | Analysis of costs, customer groups, abandoned carts, marketing campaign results, customer segments, trends over time and groups of customers who joined at the same time. Advertising and campaign spend (for example Google Ads, social media or print) can be imported so that costs can be compared with sales; the cost sources are to be confirmed with the client. |
| Why it matters | Shows what drives sales and where money is spent. |
| Who benefits | Marketing staff; management |
| Phase | P1 |
| Implementation | External system — External system + integration plugin |
| Depends on | PRD-RPT-002 |
| Status | On hold: PAID-STUB |

**User stories**

| ID | Story | Basis | Readiness |
|---|---|---|---|
| US-RPT-011-01 | As a KTDA manager, I want a cost analysis dashboard covering product, shipping, returns, discounts, advertising campaigns and taxes, so that I see where money is spent. | D; REQ-KTDA-ANL-003 | On hold: PAID-STUB |
| US-RPT-011-02 | As a member of marketing staff, I want to import advertising and campaign spend, so that costs can be compared with sales. | D | On hold: PAID-STUB |
| US-RPT-011-03 | As a KTDA manager, I want dashboards of customer demographics and behaviour, so that we know our customers. | REQ-KTDA-ANL-004 | On hold: PAID-STUB |
| US-RPT-011-04 | As a KTDA manager, I want an abandoned-cart dashboard, so that we see lost sales and recovery. | REQ-KTDA-ANL-005 | On hold: PAID-STUB |
| US-RPT-011-05 | As a KTDA manager, I want a marketing campaign performance dashboard, so that we know which campaigns work. | REQ-KTDA-ANL-006 | On hold: PAID-STUB |
| US-RPT-011-06 | As a Malawi Post manager, I want segmentation reports by district or outlet, buyer type, age, gender, rural or urban location and seller type, so that outreach and adoption campaigns are targeted. | REQ-MPC-FR-294 | On hold: PAID-STUB |
| US-RPT-011-07 | As an analyst, I want trend and cohort analysis, so that we see change over time. | D; FC-M19-011; FC-M19-012 | On hold: PAID-STUB |

**Acceptance criteria**

| ID | Story | Criterion | Basis |
|---|---|---|---|
| AC-RPT-011-01-01 | US-RPT-011-01 | **Given** orders, refunds, return fees and imported spend are in the warehouse, **when** the cost dashboard runs for a period, **then** product cost (OrderItem.OriginalProductCost x quantity), shipping charged (Order.OrderShippingInclTax), returns (refunded amounts and return fees), discounts (Order.OrderDiscount and Order.OrderSubTotalDiscountInclTax), advertising spend (imported) and taxes (Order.OrderTax) are shown by period and category. | REQ-KTDA-ANL-003; FIT (Order, OrderItem fields) |
| AC-RPT-011-01-02 | US-RPT-011-01 | **Given** orders were placed in several customer currencies, including fixed per-currency prices (CAT-042), **when** a cost or sales figure is shown, **then** amounts are in the primary store currency as nopCommerce stores them, labelled with that currency; customer-currency totals are also offered from Order.CustomerCurrencyCode and Order.CurrencyRate (BR-RPT-011). | FIT (Order.CurrencyRate); Proposed |
| AC-RPT-011-02-01 | US-RPT-011-02 | **Given** a user has Analytics.Core.AdSpend.CreateEditDelete, **when** they upload a spend file in the IC-RPT-02 layout (date, source, campaign, channel, amount, currency) and the file passes the ADM-008 upload policy for the data imports context (type, size and scan are checked only by ADM-008, decision SINGLE-FILTER), **then** each row is validated; invalid rows are listed with message Rpt.AdSpendRowRejected; valid rows are loaded (SM-RPT-02) and sent with the next extract; the import is audited (AUD-RPT-004). | D |
| AC-RPT-011-02-02 | US-RPT-011-02 | **Given** spend for the same source and date range was loaded before, **when** a new file for that scope is loaded, **then** the earlier rows are replaced, so spend is never counted twice. | Proposed |
| AC-RPT-011-03-01 | US-RPT-011-03 | **Given** customer data is in the warehouse, **when** the demographics dashboard runs, **then** customers and sales are shown by gender and age band (only where CustomerSettings.GenderEnabled and DateOfBirthEnabled collect them), location, customer role and MKT-011 attributes; behaviour shows orders per customer, repeat rate, average order value and categories bought, plus Google Analytics 4 behaviour where connected (MKT-010). | REQ-KTDA-ANL-004; FIT (Customer.Gender, Customer.DateOfBirth) |
| AC-RPT-011-04-01 | US-RPT-011-04 | **Given** cart items are extracted (ShoppingCartItem has UpdatedOnUtc; since 5.00 also Customer.LastShoppingCartUpdateDateUtc and the reminder step reached, Customer.LastAbandonedCartFollowUpNumber, used by the native abandoned-cart reminders of MKT-012), **when** the abandoned-cart dashboard runs, **then** carts idle longer than the RPT abandoned-cart idle time (setting, default not stated) are counted with value and top products, and recovery (carts followed by an order from the same customer) is shown. | REQ-KTDA-ANL-005 |
| AC-RPT-011-05-01 | US-RPT-011-05 | **Given** discount usage, newsletter campaigns, campaign tags and imported spend are in the warehouse, **when** the campaign dashboard runs, **then** orders and revenue per discount or coupon (DiscountUsageHistory), newsletter campaigns sent, campaign traffic and conversions from Google Analytics 4 e-commerce data of links carrying the MKT-010 UTM tags (where GA4 is connected), and cost per order using imported spend are shown; MKT-010 supplies only the tags. | REQ-KTDA-ANL-006; Proposed (MKT-010) |
| AC-RPT-011-06-01 | US-RPT-011-06 | **Given** address, outlet, role, MKT-011 attributes and seller attributes are in the warehouse, **when** the segmentation report runs, **then** buyers and sales are shown by district or outlet, buyer type, age band, gender, rural or urban location and seller type. | REQ-MPC-FR-294 |
| AC-RPT-011-07-01 | US-RPT-011-07 | **Given** at least two years of data are loaded, **when** the trend view runs, **then** time series with year-over-year comparison and moving averages are shown; cohorts by sign-up month and first-order month are shown. | FC-M19-011; FC-M19-012 |

**Business rules applied:** BR-RPT-050 (§8.1).


### 7.12 PRD-RPT-012 e-Government and engagement reports

| Item | Value |
|---|---|
| Description (baseline) | Reports on use of e-government services by agency, and on community engagement. |
| Why it matters | Shows the value delivered by public services on the platform. |
| Who benefits | Malawi Post; government agencies |
| Phase | P1 |
| Implementation | External system — External system + integration plugin |
| Depends on | PRD-RPT-002 |
| Status | On hold: FG-06, PAID-STUB |

**User stories**

| ID | Story | Basis | Readiness |
|---|---|---|---|
| US-RPT-012-01 | As a Malawi Post manager, I want reports on use of e-government services by agency and service type, so that we show the value delivered by public services. | D; REQ-MPC-FR-281 | On hold: FG-06, PAID-STUB |
| US-RPT-012-02 | As a Malawi Post manager, I want community engagement data in analytics, if it applies, so that we monitor adoption. | D; REQ-MPC-FR-295 | On hold: FG-06, PAID-STUB |

**Acceptance criteria**

| ID | Story | Criterion | Basis |
|---|---|---|---|
| AC-RPT-012-01-01 | US-RPT-012-01 | **Given** EGV ServiceApplication records (EGV-002) and RemittanceLine records (EGV-005) are in the warehouse, **when** the report runs for a period, **then** applications, fees collected and remitted, and fulfilment status are shown by agency and service type — held by FG-06 (e-government scope). | REQ-MPC-FR-281; FG-06; Proposed (EGV-005) |
| AC-RPT-012-02-01 | US-RPT-012-02 | **Given** a community engagement data source is named (not stated), **when** its data is loaded to the warehouse, **then** it is joined by district and period into the adoption dashboards. | REQ-MPC-FR-295 |

**Business rules applied:** none specific to this feature (§8.1 lists the module rules).


## 8. Business rules and state models

### 8.1 Business rules

| ID | Rule | Features | Basis |
|---|---|---|---|
| BR-RPT-001 | Native reports are used as delivered; they are not modified. New in-platform panels are added through admin widget zones. | RPT-001 | FIT; L1 §6.2 principle 3 |
| BR-RPT-010 | Every KPI shown in the BI platform comes from one active KPI catalogue definition (code, formula, unit); a definition change creates a new version with an effective date; the same definition is used by every dashboard (RPT-002, RPT-010, LOG-018). | RPT-002, RPT-010 | REQ-MPC-FR-288; Proposed |
| BR-RPT-011 | Money amounts in reports and dashboards are labelled with their currency. Native order amounts are in the primary store currency; for orders with fixed per-currency prices (CAT-042) these vary with the rate at placement, so customer-currency totals are offered as well. | RPT-001, RPT-010, RPT-011 | FIT (Order.CurrencyRate, CustomerCurrencyCode); Proposed |
| BR-RPT-012 | Reports and dashboards that group by financial period take their period boundaries from the PLT-012 fiscal-calendar service (FiscalCalendarSettings, client layer) when PLT-012 (P2) is delivered; until then calendar years, quarters and months are used and shown as such; calendar months are used only where the report says so. | RPT-002, RPT-010, RPT-011 | Proposed (AC-PLT-012-01-01) |
| BR-RPT-020 | Extract modes: ChangeFeed (from the SEC-004 change records) for tables without an update timestamp, Timestamp for tables with UpdatedOnUtc, IdRange for insert-only tables, Full when none applies. Event consumers are not used to capture changes, because some writes publish no event and consumers swallow exceptions. | RPT-003 | FIT (no UpdatedOnUtc on Order, OrderItem, Customer, Shipment; L1 §6.3 SEC-004 note); Proposed |
| BR-RPT-021 | Fields marked for pseudonymisation or removal are treated before the data leaves nopCommerce; the hashing key stays in the client instance and is never exported. | RPT-003 | REQ-MPC-FR-293; CFG-01 |
| BR-RPT-030 | External consumers (BI tools, warehouse readers, other systems) get read-only access to defined views or delivered files only; never write access to the shop database; credentials are stored encrypted per client instance. | RPT-004, RPT-005, RPT-008 | REQ-MPC-FR-285; REQ-MPC-FR-289; CFG-01; Proposed |
| BR-RPT-040 | The public page shows only aggregates from a snapshot; groups below the minimum group size are suppressed; no field classed as personal data is used. | RPT-007 | D (anonymised); Proposed |
| BR-RPT-060 | Platform conformance (all RPT features): every new RPT setting key is listed in the RPT plugin key catalogue (key, type, layer, secret flag, default); keys that hold a credential, key or token (BI and external-consumer credentials, the pseudonymisation hashing key) are flagged secret, so the pack loader refuses them and exports omit them. RPT pages, widgets and scheduled tasks (extracts, snapshots, deliveries) run for a store only when IC-PLT-02 IsEnabled(productfeature.<RPT feature ID>) is true for that store. RPT writes its own tables through IRepository<>; business audit events AUD-RPT-nnn are written through IC-SEC-01 WriteAsync with a correlation id. | All RPT features | Proposed (BR-PLT-013, AC-PLT-003-01-04, AC-PLT-022-02-01; BR-SEC-010, BR-SEC-011, BR-SEC-014); CFG-01 |
| BR-RPT-050 | Imported spend for a source and date range replaces any earlier import for the same scope. | RPT-011 | Proposed |


### 8.2 State models (Proposed)

Only the transitions listed are allowed; any other transition is rejected and logged.

| Model | Entity | From | Event | Guard | To | Side effect |
|---|---|---|---|---|---|---|
| SM-RPT-01 | ExtractRun | (none) | schedule time or manual rerun | no other run of the dataset active | Running | — |
| SM-RPT-01 | ExtractRun | Running | files and manifest written | — | Succeeded | watermark advanced; AUD-RPT-002 |
| SM-RPT-01 | ExtractRun | Running | error | — | Failed | watermark unchanged; administrators notified |
| SM-RPT-01 | ExtractRun | Failed | retry | retries left (setting) | Running | — |
| SM-RPT-02 | AdSpendImport | (none) | file uploaded | Analytics.Core.AdSpend.CreateEditDelete | Validating | — |
| SM-RPT-02 | AdSpendImport | Validating | at least one valid row | — | Loaded | earlier import of same scope Replaced (BR-RPT-050) |
| SM-RPT-02 | AdSpendImport | Validating | no valid row | — | Rejected | rejected rows listed |
| SM-RPT-02 | AdSpendImport | Loaded | new import for the same scope loaded | — | Replaced | rows excluded from extracts |
| SM-RPT-03 | KpiDefinition | (none) | created | formula valid against the data dictionary | Draft | — |
| SM-RPT-03 | KpiDefinition | Draft | activated | Analytics.Core.KpiCatalogue.CreateEditDelete | Active | exported to BI (IC-RPT-03); AUD-RPT-003 |
| SM-RPT-03 | KpiDefinition | Active | new version activated | — | Superseded | old version kept for earlier periods |
| SM-RPT-03 | KpiDefinition | Active | retired | — | Retired | removed from new dashboards |


## 9. Data model (Proposed design — to be approved)

New entities are plugin tables (FluentMigrator migrations in the product assembly); native entities are not altered unless the L1 §6.3 register says so.

| Entity | Fields | Features | Relation to native nopCommerce |
|---|---|---|---|
| ExtractDataset (new) | Id, Name, SourceTables, Mode (ChangeFeed, Timestamp, IdRange, Full), Schedule, TreatedFields (field, Pseudonymise / Remove), IsActive | RPT-003 | Reads native tables; changes nothing in them |
| ExtractRun (new) | Id, DatasetId, Status (SM-RPT-01), WatermarkFrom, WatermarkTo, RowCount, Checksum, StartedOnUtc, EndedOnUtc, Error, ManifestDownloadId | RPT-003 | |
| DataDictionaryEntry (new) | Dataset, Field, Type, Description, SourceTable, SourceColumn, PersonalDataClass | RPT-003, RPT-005, RPT-007 | Personal-data class aligned with SEC-014 when live |
| KpiDefinition (new) | Code, Name (localised), Description, Formula, Unit, Owner, Target, Version, EffectiveFromUtc, Status (SM-RPT-03) | RPT-002, RPT-010 | Config pack row "KPI catalogue" (Core) |
| AdSpendImport / AdSpendRow (new) | Import: Source, DateFrom, DateTo, UploadedBy, Status (SM-RPT-02); Row: Date, Source, Campaign, Channel, Amount, CurrencyCode, RejectReason | RPT-011 | |
| ExternalConsumer (new) | Name, Type (BI, Warehouse reader, Other system), AuthorisedDatasets, Delivery (Batch, API), CredentialsRef (encrypted), IsActive | RPT-004, RPT-008 | |
| PublicMetric / PublicSnapshot (new) | Metric: Code, KpiCode, DisplayOrder, IsPublished; Snapshot: CreatedOnUtc, Values (JSON) | RPT-007 | |
| OperatorMetricDaily (new) | Date, CustomerId (staff), Team, ItemsHandled, TimersMet, TimersBreached, ReworkCount, DisputeCount | RPT-009 | Built from ADM-007, CRM-014 and RET data |


## 10. Configuration

### 10.1 Configuration-pack rows owned by this module (from the workbook "Config pack schema")

| Artefact | nopCommerce 5.00 source | Layers | Owning PRD | Pack |
|---|---|---|---|---|
| KPI catalogue | KPI definitions and formulas (new) | vertical → client | RPT-002 | Core |
| Analytics pack settings | Data warehouse sources, BI connection, dashboard sets, public metrics | vertical (Analytics pack) → client | RPT-010 / RPT-011 / RPT-007 / RPT-008 | Analytics pack |

### 10.2 Settings and client values

| Setting | Where it lives | Layer | KTDA (source) | Malawi Post (source) |
|---|---|---|---|---|
| Native report permissions per role | PermissionRecordCustomerRoleMapping for Reports.* (native) | vertical → client | Not stated | Not stated |
| Extract datasets, modes, schedules, off-peak window, retries | ExtractDataset (new); Analytics pack row | vertical → client | Not stated (KG-17) | Not stated (MG-12) |
| Pseudonymisation and removal per field | ExtractDataset.TreatedFields (new) | country → client | Not stated | When required by policy (FR-293); fields not stated |
| KPI catalogue | KpiDefinition (new); config pack row "KPI catalogue"; Logistics and postal pack seeds the BR-LOG-120 definitions (Proposed) | vertical → client | Not stated | Registrations, active buyers/sellers, GMV, orders, conversion (FR-276); definitions not stated |
| BI connection and external consumers | ExternalConsumer (new); credentials per instance | client instance only | Not stated | Other government / MPC systems (FR-289); not named |
| Advertising spend sources | RPT settings (new) | client | Not named (ANL-003) | — |
| Public metrics; minimum group size; snapshot schedule | PublicMetric (new), RPT settings | client | — | — |
| Operator metric definitions (rework, dispute rate) | RPT settings (new) | client | Not stated | Not stated |
| Abandoned-cart idle time | RPT settings (new) | client | Not stated (ANL-005) | — |
| Fiscal year start | FiscalCalendarSettings (PLT-012, client layer) | client | Not stated | Not stated |
| Fast and slow movers report: default period | RPT settings (new) | client | Not stated (ANL-002) | — |
| Dashboard refresh interval | BI platform setting (external) | client | Not stated | Not stated |
| Google Analytics 4 e-commerce events | GoogleAnalyticsSettings.EnableEcommerce (bundled plugin, MKT-010) | client → store | Not stated | Not stated |

Runtime settings resolve at two levels only (store value, else shared value); global, country, vertical, client and store layers are merged by the pack loader at apply time in that order (BR-PLT-010; L1 §6.5).


## 11. Screens, user interface and messages

### 11.1 Screens

| Area | Screen | Features | Native or new |
|---|---|---|---|
| Admin | Dashboard and native reports | RPT-001 | Native |
| Admin | Fast and slow movers and stock-level report | RPT-001 | New (RPT plugin page; data from INV-013) |
| Admin | Extract datasets, runs, manifests, data dictionary | RPT-003 | New |
| Admin | KPI catalogue | RPT-002 | New |
| Admin | Advertising spend import | RPT-011 | New |
| Admin | External consumers and BI connections | RPT-004, RPT-008 | New |
| Admin | Operator metrics | RPT-009 | New |
| Admin | Public metrics selection | RPT-007 | New |
| Storefront | Public transparency page | RPT-007 | New route |
| BI platform | Executive, operational, commerce, marketing, compliance, e-government dashboards; schedules; self-service | RPT-002, RPT-004, RPT-005, RPT-006, RPT-010, RPT-011, RPT-012 | External |

Screen layouts are not specified here. They follow the approved designs (to be produced) and the client theme (PLT-006); dashboards in the BI platform follow approved dashboard designs. Until approved, developers build no layout of their own beyond the native nopCommerce admin and DefaultClean storefront patterns.


### 11.2 User-facing messages (locale resource keys)

| Key | Default English text (Proposed) | Used by |
|---|---|---|
| Rpt.KpiFormulaInvalid | The formula uses a field that is not in the data dictionary. | AC-RPT-002-02-02 |
| Rpt.AdSpendRowRejected | This row was not loaded. See the reason shown. | AC-RPT-011-02-01 |
| Rpt.SuppressedSmallGroup | Not shown: too few records to publish safely. | AC-RPT-007-01-02 |

Default English text is Proposed. Every key is a locale resource (Definition of Done criterion 8); client language packs translate it. Administrator notifications go through TRK-005 (decision MSG-ROUTE) as the RPT event code Analytics.Core.ExtractFailed, registered by the RPT plugin at installation through IC-TRK-04 RegisterEventCode and sent with IC-TRK-04 SendEvent (name Proposed; listed in BR-TRK-023). Texts inside the BI platform are maintained there.


## 12. Integrations, contracts, events and concurrency

### 12.1 External interfaces

| Interface | Operations | Counterpart | Note |
|---|---|---|---|
| Data warehouse and ETL (RPT-003) | Receive extracts and dictionary (IC-RPT-01); run quality checks | External (not named, MG-12) | Hosting and sizing open (C-SIZE) |
| BI platform (RPT-002, RPT-004, RPT-005, RPT-010, RPT-011, RPT-012) | Read warehouse views; KPI catalogue (IC-RPT-03); schedules | External (not named, KG-17); or official Power BI plugin (PAID-STUB) | — |
| Power BI plugin (RPT-008) | Licensed data connector | nopCommerce team (paid; V-01) | Bundled Misc.PowerBI is a stub |
| Google Analytics 4 (RPT-002, RPT-011) | Visits, behaviour, campaign traffic exported to the warehouse | Google (MKT-010) | Export route not stated |
| Advertising platforms (RPT-011) | Spend files | Sources not named (for example Google Ads, social media, print, from the feature description) | File import only (Proposed) |
| Other government / Malawi Post systems (RPT-004) | Batch files or API (IC-RPT-04, INT-001) | Not named | — |
| SEC-004 audit store (RPT-003, RPT-006) | Change records for extracts (QueryAsync with the sequence-watermark filter) and audit report data, including AUD-IAM-010 read access, through IC-SEC-01 QueryAsync or signed exports | SEC module | — |
| Notification engine (RPT-003) | Event code Analytics.Core.ExtractFailed registered with IC-TRK-04 RegisterEventCode and sent with SendEvent | TRK-005 | Decision MSG-ROUTE |
| Upload policy (RPT-011) | Data imports context | ADM-008 | Decision SINGLE-FILTER |
| Integration message log (RPT-004) | Batch delivery with retry | INT-004 | — |
| Inventory stock-movement data (RPT-001) | GetStockMovementData (IC-INV-06): snapshots, movements by reason, current sellable stock | INV-013 | Read only; decision ANL-002-OWN |
| Help-desk extract views (RPT-003, RPT-010) | GetExtractViews (IC-CRM-05) | CRM module | Read only |

### 12.2 Interface contracts

| Contract | Operation | Inputs | Outputs | Errors | nopCommerce mapping |
|---|---|---|---|---|---|
| IC-RPT-01 | Extract (nopCommerce to warehouse staging) | Dataset definition, mode, watermark | Data files and manifest (dataset, run ID, row count, checksum, treated fields); data-dictionary file | Source unavailable, staging unavailable | RPT export plugin IScheduleTask; reads replica or primary; ChangeFeed from SEC-004 |
| IC-RPT-02 | Advertising spend file | CSV rows: date, source, campaign, channel, amount, currency | Import result: loaded and rejected rows with reasons | Unknown currency, bad date, negative amount | RPT plugin upload page; stored rows go out with the next extract |
| IC-RPT-03 | KPI catalogue export | Active KPI definitions | File or API payload in the format of the chosen BI platform (not stated) | — | RPT plugin; consumed by the BI semantic layer |
| IC-RPT-04 | Report delivery to other systems | Registered consumer, authorised datasets, schedule | Batch file with manifest, or API response through INT-001 | Not authorised | RPT plugin + INT-001; logged (AUD-RPT-008) |

File formats and transport (for example CSV or columnar files, SFTP or object storage) depend on the warehouse and BI products, which are not named (KG-17, MG-12); they are fixed when the products are chosen and approved by the tech lead.

### 12.3 Events

| Module event | Native nopCommerce event / mechanism | Consumers / effect |
|---|---|---|
| Extract run completed / failed | None (RPT task) | Administrators notified on failure; warehouse load |
| Data changes in tables without UpdatedOnUtc | SEC-004 change records (IRepository<> decorator), not entity events | RPT-003 ChangeFeed mode (BR-RPT-020) |
| KPI definition activated | None (RPT module event) | IC-RPT-03 export to BI |
| Ad spend loaded | None (RPT module event) | Next extract |
| Dashboard panel | Admin widget zones admin_dashboard_* | RPT-001 in-platform panels |

Event consumers in nopCommerce swallow exceptions (L1 §6.2 principle 8): money-moving logic runs in services, not in consumers; consumers only notify or enqueue jobs.

### 12.4 Concurrency and timing cases

| Case | Features | Required behaviour |
|---|---|---|
| Two runs of the same extract dataset | RPT-003 | Runs take ILocker.PerformActionWithLockAsync keyed 'rpt-extract-{DatasetId}' (distributed when DistributedCacheConfig.Enabled; per host otherwise, L1 §6.4); a second run waits or is skipped; the watermark advances only on Succeeded |
| Two spend uploads for the same source and range | RPT-011 | Imports run under the lock 'rpt-adspend-{Source}'; the later upload replaces the earlier (BR-RPT-050) |
| Snapshot build while the public page is read | RPT-007 | The page reads the last completed snapshot; a new snapshot is switched in only when complete |


## 13. Notifications

| Trigger | Recipient | Channel | Feature |
|---|---|---|---|
| Extract run failed after retries | Administrators | Event code Analytics.Core.ExtractFailed (IC-TRK-04), channels per TRK-005 | RPT-003 |
| Data-quality blocking rule failed | Data owner | Email from the pipeline (external) | RPT-003 |
| Scheduled report | Named recipients | Email from the BI platform (external) | RPT-004 |
| Ad spend import result | Uploader | On-screen result | RPT-011 |


## 14. Reports and audit

### 14.1 Reports

| Report | Feature | Basis |
|---|---|---|
| Native dashboard and reports; fast and slow movers and stock-level report | RPT-001 | REQ-KTDA-ANL-001, ANL-002; REQ-MPC-RPT-001; ANL-002-OWN |
| Executive KPI dashboards (text and graphic); monthly operations report | RPT-002 | REQ-MPC-FR-276, FR-288, FR-296; REQ-MPC-RPT-001 |
| Data-quality report | RPT-003 | REQ-MPC-FR-291 |
| Audit and compliance reports | RPT-006 | REQ-MPC-FR-287, FR-292 |
| Public transparency figures | RPT-007 | FC-M19-010 |
| Operator metrics | RPT-009 | FC-M04-029 |
| Logistics, payments, seller, fraud and operations dashboards | RPT-010 | REQ-MPC-FR-277 to FR-280 |
| Cost, demographics, abandoned carts, campaigns, segmentation, trends | RPT-011 | REQ-KTDA-ANL-003 to ANL-006; REQ-MPC-FR-294 |
| E-government usage and engagement | RPT-012 | REQ-MPC-FR-281, FR-295 |

### 14.2 Audit event catalogue

| ID | Event | Actor | Entity | Fields recorded |
|---|---|---|---|---|
| AUD-RPT-001 | Extract dataset or pseudonymisation change | Administrator | ExtractDataset | old values, new values |
| AUD-RPT-002 | Extract run result | System | ExtractRun | dataset, rows, checksum, status |
| AUD-RPT-003 | KPI definition change or activation | Analyst | KpiDefinition | version, formula, effective date |
| AUD-RPT-004 | Ad spend import or replacement | Marketing staff | AdSpendImport | source, range, rows loaded, rows rejected |
| AUD-RPT-005 | BI connection or external consumer change | Administrator | ExternalConsumer | old values, new values (credentials never logged) |
| AUD-RPT-006 | Public metric published or withdrawn | Administrator | PublicMetric | metric, state |
| AUD-RPT-007 | Operator metric definitions changed | Administrator | RPT settings | old values, new values |
| AUD-RPT-008 | Report data delivered to an external system | System | ExternalConsumer | datasets, rows, time |

Business audit events AUD-RPT-nnn are written through IC-SEC-01 IAuditTrail.WriteAsync with a correlation id; old and new values of RPT tables are captured by the SEC-004 IRepository<> decorator (BR-RPT-060). The native activity log is not used as the audit record. Names and fields are Proposed. Audit inside the BI platform and warehouse is a function of those products.


## 15. Non-functional requirements

| ID | Requirement | Basis | Verified by |
|---|---|---|---|
| NFR-RPT-001 | Extraction does not slow down the shop: it reads a replica or runs in the off-peak window. Performance target: Not stated in source — requires confirmation. | D (RPT-003 why); NFR-X-009 | AC-RPT-003-01-04 |
| NFR-RPT-002 | Personal data is pseudonymised or removed per policy before it leaves nopCommerce. | REQ-MPC-FR-293; NFR-X-002 | AC-RPT-003-05-01; test note T-RPT-02 |
| NFR-RPT-003 | External consumers have read-only access; credentials are encrypted per instance and never in packs. | CFG-01; NFR-X-001 | AC-RPT-008-01-03 |
| NFR-RPT-004 | Data freshness of dashboards: Not stated in source — requires confirmation. | NFR-X-009 | — (no target) |
| NFR-RPT-005 | The public page never shows personal data or small groups. | D; BR-RPT-040 | AC-RPT-007-01-02, AC-RPT-007-01-03 |
| NFR-RPT-006 | Extract, KPI, import and connection changes are audited (NFR-X-003). | NFR-X-003 | §14.2 audit events |

Cross-cutting NFR-X-001 to NFR-X-009 (L1 §8.3) also apply.


## 16. Dependencies, phase and build order

| PRD ID | Phase | Depends on | Needed by |
|---|---|---|---|
| PRD-RPT-001 | P1 | — | |
| PRD-RPT-002 | P1 | PRD-RPT-003 | PRD-RPT-010, PRD-RPT-011, PRD-RPT-012 |
| PRD-RPT-003 | P1 | — | PRD-RPT-002 |
| PRD-RPT-004 | P1 | — | |
| PRD-RPT-005 | P1 | — | |
| PRD-RPT-006 | P1 | — | |
| PRD-RPT-007 | P3 | — | |
| PRD-RPT-008 | P2 | — | |
| PRD-RPT-009 | P2 | — | |
| PRD-RPT-010 | P1 | PRD-RPT-002 | |
| PRD-RPT-011 | P1 | PRD-RPT-002 | |
| PRD-RPT-012 | P1 | PRD-RPT-002 | |

Build order inside the module follows dependencies: the connector frameworks first, then adapters, then features that consume them. The Product Owner orders the Product Backlog; this list is not an order.


## 17. Test notes

| ID | Test note |
|---|---|
| T-RPT-01 | Extract completeness: for each dataset and mode, compare row counts and checksums between source and staging after inserts, updates and deletes, including tables without UpdatedOnUtc (ChangeFeed) and a failed-then-retried run. |
| T-RPT-02 | Pseudonymisation: scan extract files for personal-data fields marked for treatment; none may appear in clear text; the hashing key never appears in any export. |
| T-RPT-03 | KPI catalogue: one definition change appears in every dashboard that uses it, with earlier periods unchanged. |
| T-RPT-04 | Access: native report permissions (both attributes), BI group and field security, row scope, and read-only external connections each have allow and deny cases. |
| T-RPT-05 | Public page: small-group suppression and personal-data refusal. |
| T-RPT-06 | State models: every transition of SM-RPT-01 to SM-RPT-03 is tested; transitions not listed are rejected. |
| T-RPT-07 | Permissions: each permission in §4 has an allow and a deny case (§4.1). |
| T-RPT-08 | Stock reports: for a seeded period, the Fast and slow movers report matches INV-013 units sold and stock snapshot per product and warehouse in both sort orders, including zero-sale products. |
| T-RPT-09 | Conformance: with productfeature.<RPT feature ID> off for a store, RPT pages and tasks do nothing for that store; every RPT setting key is in the key catalogue and credential and hashing keys are flagged secret and absent from pack exports; fiscal-period reports follow FiscalCalendarSettings. |
