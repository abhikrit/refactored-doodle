# L0 PR/FAQ — Reusable B2B + B2C e-commerce product on nopCommerce 5.00

<!-- Product overview (Part 0 of the Product PRD). Written from the facts in Part 1 and the baseline workbook; every count in double braces is filled in from the workbook by build_master.py. No dates, quotes or metrics are invented; the usual customer quotes of a PR/FAQ are omitted because no source provides them. Client compliance is reported in the Compliance and traceability report; decisions and gaps in the Decisions, gaps and open items register. -->

## Press release (internal, working draft)

**CSM Technologies builds one reusable e-commerce product on nopCommerce 5.00.1 (.NET 10) for KTDA, Malawi Post and future clients.**

KTDA (Kenya) and Malawi Post each asked for an e-commerce platform. Their requirements overlap heavily:
- catalogue, search, cart and checkout;
- mobile money and card payments;
- delivery and tracking, returns, customer service, reporting;
- integration with their own systems.

Building two separate platforms would mean doing the same work twice. Every later client would mean doing it again.

The product answers both clients, and every future one, with one code base. Each client gets its own installation of the same product version. What differs between clients is handled in one of three ways:
- **settings and configuration packs:** branding, taxonomy, roles, languages, currencies, checkout rules, workflows; layered global, country, vertical, client and store (decision CFG-01, Proposed);
- **country adapters:** M-Pesa (named by KTDA), TNM Mpamba and Airtel Money (named by Malawi Post); couriers and postal systems. KRA eTIMS and MRA EIS e-invoicing adapters are planned by inference only: neither client source states them, and they are subject to decision E-INV;
- **client adapters:** for Malawi Post, PostGlobal and SAGE 200 are separate client-extension features (INT-007, INT-006). KTDA's ERP and bank are not named in the KTDA source (gaps KG-03, KG-04): until they are, the KTDA adapters are criteria of the INT-005 and INT-008 frameworks held by those gaps, the KTDA bank card adapter (PAY-031) is held, and whether the KTDA adapters become separate client-extension features is decision KTDA-ADP.

Onboarding a new client means configuring the product, not rebuilding it.

The product serves:
- **Buyers:** business buyers (B2B) and consumers (B2C).
- **What they buy:** goods and services, including bookings and service delivery.
- **Optional packs:** marketplace sellers, trade finance, postal logistics, e-Government services and AI.

It covers all 469 in-scope features of the CSM Product Blueprint Feature Catalog, as 434 product features in 24 modules. Every feature has user stories and testable acceptance criteria in its module chapter (Part 2). How the features meet the KTDA and Malawi Post requirements is reported separately in the Compliance and traceability report.

Delivery is phased:

| Phase | Purpose | Features |
|---|---|---|
| P1 | What KTDA, Malawi Post and similar projects need, plus the machinery for onboarding by configuration | {{P1}} |
| P2 | Remaining general e-commerce | {{P2}} |
| P3 | Specialised and AI capabilities | {{P3}} |

## FAQ

| Question | Answer | Source |
|---|---|---|
| What is the product? | One nopCommerce 5.00 product, B2B and B2C, goods and services, configured per client. | Part 1 §2 |
| Which version of nopCommerce? | 5.00.1 on .NET 10, verified against the release-5.00.1 source (decision VER-500, approved 2026-11-24; it replaces the earlier choice of 4.90). The project brief still says 4.70.5. | Part 1 §0, §6.1, Appendix B |
| Is it one system for all clients? | Each client gets its own installation of the same product version, which gives full data isolation. A shared installation is an open architecture decision (F-CAT-B). | Part 1 §6.4 |
| How much is out of the box? | {{FIT_OOB}} features are configuration of stock nopCommerce 5.00.1. {{FIT_LIC}} use a licensed plugin. {{FIT_CODE}} need code-level work, mostly plugins. {{FIT_EXT}} are external systems connected by an integration plugin. {{FIT_CHG}} features moved category with 5.00 ({{FIT_CHG_IDS}}). | Part 1 §6.7 |
| Do we change nopCommerce itself? | Only for the features in the core-modification register (Part 1 §6.3). Each change is isolated on a product fork branch and re-applied on upgrade. Everything else is a plugin. Service overrides have one owning core feature each (product extension register, Part 1 §6.3; decision OVR-REG, Proposed). | Part 1 §6.2, §6.3 |
| Does 5.00 change how sellers' carts and customer prices work? | One cart can hold items from several sellers; checkout splits the order and payment across them (decision CART-500). The 5.00 option that keeps a separate cart per seller stays off. Customer and company prices use the 5.00 native price lists; prices fixed per currency remain a build, and a rule is set where a quantity (tier) price and a price-list price both apply (decision PRICE-500). | Part 1 §6.1, §6.5 |
| What is not in the product? | Tender, auction and bid management (75 catalog features, decision D-02). Also project services: training, support, hosting, hardware and marketing campaigns. | Part 1 §3.2 |
| What can a developer start now? | Items the Product Owner has ordered, whose module chapter is approved, that are not on hold for an open decision (Appendix A, "On hold"; a feature that depends on a feature on hold is on hold too), and whose readiness conditions are decided or accepted. | Part 1 §3.3, Appendix A |
| Where are the open decisions? | In the Decisions, gaps and open items register. Appendix B of Part 1 gives a one-line meaning of every decision and gap ID used in this document. | Part 1 Appendix B |
| How is success measured? | Not stated in any source. The Product Owner sets measures, for example time to onboard a new client. | Part 1 §2.4 |
| How is quality assured? | Through the Definition of Done (13 criteria), acceptance criteria per user story with one test case per criterion, and approval of each module chapter by the Product Owner. | Part 1 §11 |

## Flags / Open Items / Conflicts

| Type | Item | Source |
|---|---|---|
| Inference | KRA eTIMS and MRA EIS e-invoicing adapters (PAY-026, PAY-027) are not in either client source; they are planned from external law and are subject to decision E-INV. | Part 1 §10.3 |
| Gap | KTDA ERP and bank (KG-03, KG-04), the Malawi Post card gateway (MG-03) and the MANEPS interface (MG-09) are not stated; the adapters that need them are on hold. | Part 1 Appendix A, Appendix B |
| Conflict | Project brief (nopCommerce 4.70.5 with AFR extensions) against the chosen target 5.00.1 on .NET 10 (decision VER-500, approved 2026-11-24; brief to be updated). | Part 1 §0 |
| Open | Whether the third-party plugin vendors (NopStation, Nop-Templates, FoxNetSoft) and AFR publish nopCommerce 5.00 builds is not verifiable from the source (V-01). | Part 1 §6.1, §6.8 |
| Open | Data protection for the external services in the 5.00 fit (Google AI search, Jotform chatbot, Twilio SMS), and Twilio coverage in Kenya and Malawi, are not stated in any source. | Part 1 §6.1 |
| Gap | No success measure is stated in any source. | Part 1 §2.4 |
