# Product Requirements — Client Edition

**Reusable e-commerce product for business buyers, shoppers and public services**

**For KTDA, Malawi Post and future clients**

Version 1.1 · 24 November 2026 · Draft for client review

This edition describes all 434 product features and all quality and service requirements in business language.

<!-- pagebreak -->

## Contents

<!-- TOC -->

<!-- pagebreak -->

# 0. Document control

| Item | Detail |
|---|---|
| Document | Product Requirements — Client Edition |
| Version | 1.1 |
| Date | 24 November 2026 |
| Status | Draft for client review. Not approved. |
| Prepared by | CSM Technologies |
| Approval | By the Product Owner, after client review |
| Source | The product baseline and the developer Product PRD; this edition adds nothing to their scope |

# 1. Introduction

## 1.1 Purpose

This document describes, in business language, everything the product does and the quality it must meet. It covers all 434 product features in 24 modules, and every quality and service requirement. It explains what the product does and why; how it is built is in the developer Product PRD.

## 1.2 Audience

Client executives, programme managers, business owners and procurement evaluators of KTDA, Malawi Post and future clients. No technical knowledge is needed.

## 1.3 How to read this document

- Sections 2 to 6 explain what the product is, what it covers, who uses it and how it works for them.
- Section 7 describes every feature, module by module. Each feature has a small facts box: the delivery phase, whether it is always included or part of an optional pack, who it is for, and whether it is planned or depends on a pending decision.
- Section 8 lists every quality and service requirement. The reference in square brackets is the number the requirement has in the client documents or in the product baseline.
- Sections 9 to 12 cover connections to other systems, what each client can set up without development, the release plan, and assumptions and dependencies.
- Appendix A lists every feature with its page; each entry is a link. Appendix B explains the terms used.
- Where the source says a design choice is proposed, this document says "proposed". Where a fact is not stated in the source, this document says so instead of filling the gap.

## 1.4 Related documents

| Document | What it contains |
|---|---|
| Product PRD (developer edition) | The full specification: user stories, acceptance criteria, rules, data, screens and technical design for every feature. |
| Compliance and traceability report | How each KTDA and Malawi Post requirement is delivered, with traceability from requirement to test. |
| Decisions, gaps and open items register | Open decisions, missing information and open questions, with owners. |

# 2. Product overview

## 2.1 Vision and product goal

One reusable e-commerce product for business buyers and individual shoppers, where onboarding a new client means configuring the product, not rebuilding it — starting with KTDA (Kenya) and Malawi Post. (Product Goal, proposed; the Product Owner to confirm.)

## 2.2 What the product is

- One product, one code base, the same version for every client.
- Each client gets its own installation of the product, which keeps each client's data separate.
- Differences between clients are handled by settings and configuration packs, by country connections (for example mobile money and couriers) and by client connections to the client's own systems — not by changing the product for one client.
- It sells goods and services, to business buyers (B2B) and individual shoppers (B2C), and can offer government services to citizens and businesses as an optional pack.

## 2.3 Who it serves

Shoppers and business buyers; sellers on a marketplace; client staff in catalogue, sales, finance, logistics, marketing, support and management roles; outlet staff and agents who serve walk-in customers; government agencies, regulators and auditors where a client uses those parts.

## 2.4 Benefits

- Faster onboarding of new clients: a new client is configured, not built.
- Lower cost of ownership: every client benefits from the same improvements and fixes.
- Choice of channels: web, mobile, USSD, SMS, WhatsApp and assisted service at outlets, where enabled.
- Local payment and delivery options through country connections, such as M-Pesa in Kenya and TNM Mpamba and Airtel Money in Malawi.
- Clear phasing: what is needed first is delivered in phase 1.

Measurable success targets (for example the time to onboard a new client) are not stated in the source documents. The Product Owner is to set them.

# 3. Scope

## 3.1 In scope

| Item | Detail |
|---|---|
| Product features | 434, in 24 modules |
| Phases | Phase 1: 337; Phase 2: 76; Phase 3: 21 |
| Commerce types | Goods and services; business buyers (B2B) and individual shoppers (B2C); government services to citizens and businesses (G2C, G2B) as an optional pack |
| Feature catalogue coverage | All 469 in-scope features of the product feature catalogue are covered by the 434 product features |

## 3.2 Out of scope

| Item | Detail |
|---|---|
| Tender, auction and bid management | Left out of the product by decision D-02. Requests for quotation, contracts, scheme payouts and group buying stay in scope. |
| Project services | Training, support and maintenance, hosting provision, hardware, marketing campaigns run by the supplier, and reports and documents delivered by the project are delivered by the project, not by product features. |
| Rails from other countries | Payment rails and regulations specific to other countries in the feature catalogue or in the reference deployment are not carried. Kenya and Malawi equivalents are named only where a client document confirms them. |

## 3.3 Always included and optional packs

Part of the product is always included in every installation. Other parts come in optional packs, switched on for a client that needs them. A pack is switched on by configuration; it does not change the product for other clients.


| Pack | What it adds | Features |
|---|---|---|
| Marketplace pack | Lets independent sellers register, list and sell, with commission, payouts and seller performance management. | 42 |
| Business trade pack | Company accounts, contract prices, credit terms, approvals, quotations, contracts and trade documents for business buyers. | 34 |
| Postal and logistics pack | Postal operations such as parcel acceptance at post offices, sorting hubs, tracking numbers and cross-border postal exchange. | 19 |
| Services and bookings pack | Selling services: bookings, appointments, service delivery and completion. | 15 |
| Engagement and loyalty pack | Loyalty points, promotions, abandoned-cart reminders, referrals and subscriptions. | 13 |
| Commerce extensions pack | Extra commerce options such as purchase restrictions, return fees, product feeds and PayPal. | 10 |
| e-Government pack | Government services to citizens and businesses: applications, fees, appointments and issued documents. | 10 |
| Artificial intelligence pack | Artificial intelligence features such as a chat assistant, recommendations and content help. | 10 |
| Analytics pack | Data warehouse, dashboards and advanced analytics. | 8 |
| Warehouse pack | Warehouses, batch and lot tracking, serial numbers, expiry dates and stock counts. | 8 |
| Channels pack | Mobile apps, USSD, WhatsApp and other messaging channels. | 8 |
| Agri-finance and schemes pack | Government or programme schemes, subsidies and partner finance and insurance products. | 6 |
| Assisted service pack | Agents and outlet staff who register and serve walk-in customers, take cash and print receipts. | 5 |
| Service desk extensions pack | Complaint escalation and dispute resolution, and a directory of support channels. | 5 |
| Access and administration extensions pack | Delegated access, passwordless and biometric sign-in, and guided tours for staff. | 3 |
| Always included | The platform core used by every client | 219 |
| Country and client connections | Connections for one country or one client: couriers, payment providers and client systems | 19 |


## 3.4 One product, configured per client

Every client runs the same product. Branding, product categories, roles, languages, currencies, checkout rules and workflows are set per client (section 10). Country needs — payment methods, couriers, statutory e-invoicing and data-protection rules — are country connections or country packs, never changes to the product itself.

# 4. Stakeholders and users

## 4.1 Who uses the product

The groups below are named in the product baseline as the people each feature serves (number of features naming the group). The source documents do not define detailed personas.

| Group | Features serving it |
|---|---|
| Shoppers | 159 |
| Clients | 48 |
| Sellers | 47 |
| Business buyers | 40 |
| Finance staff | 34 |
| Marketing staff | 17 |
| Platform team | 15 |
| Client staff | 15 |
| Support staff | 15 |
| Auditors | 13 |
| Catalogue staff | 13 |
| Client administrators | 12 |
| Management | 12 |
| Malawi Post | 12 |
| Logistics staff | 12 |
| Service providers | 11 |
| Regulators | 8 |
| Compliance staff | 8 |
| International buyers | 8 |
| All users | 7 |
| IT teams | 6 |
| Sales staff | 6 |
| Stock staff | 6 |
| Warehouse staff | 6 |
| Government agencies | 6 |
| Export staff | 5 |
| Citizens | 5 |
| Walk-in customers | 4 |
| Couriers | 4 |
| Outlet staff | 4 |
| KTDA logistics | 4 |
| New clients | 3 |
| Content staff | 3 |
| Staff | 3 |
| Partners | 3 |
| IT | 3 |
| Fraud staff | 3 |
| Programme staff | 3 |
| Malawi Post operations | 3 |
| Support managers | 3 |
| Analysts | 3 |
| Operations staff | 3 |


## 4.2 Channels

| Channel | How it is used |
|---|---|
| Web shop | Shoppers, business buyers and citizens on phone, tablet and desktop browsers; the site can be installed on a phone like an app. |
| Back office | Client staff and sellers manage catalogue, orders, payments, delivery, support and reports. |
| Mobile apps | Native mobile apps; whether they are a Malawi Post deliverable is pending (decision M-19). |
| USSD | Menu-based service on basic phones (Malawi Post). The use cases and the mobile network operator are not stated. |
| SMS | Text messages for one-time codes and notifications; the SMS provider is not named. |
| WhatsApp and WeChat | Chat with the business (KTDA asks for WhatsApp Business and WeChat; Malawi Post for a chatbot on WhatsApp and the website). |
| Live chat | Live chat on the website (KTDA). |
| Assisted service at outlets | Agents and outlet staff serve walk-in customers, take cash payments and print receipts (Malawi Post). |


## 4.3 Features by audience

| Audience | Features |
|---|---|
| Business buyers and shoppers | 233 |
| Staff (back office) | 111 |
| Sellers and staff (back office) | 38 |
| Business buyers | 34 |
| Citizens and businesses (government services) | 12 |
| Individual shoppers | 6 |
| Total | 434 |

# 5. Service principles

These principles come from the product baseline and the client documents; the reference shows where each is stated.

| Principle | What it means for this product | Reference |
|---|---|---|
| User-centred | Features are described from the user's point of view; each has user stories with testable acceptance criteria in the developer PRD. | Product PRD Part 2 |
| Inclusive and accessible | Proposed standard WCAG 2.1 level AA; the clients state keyboard navigation and screen-reader support, light pages for low bandwidth and low-end devices, and use on phones, tablets and desktops. | [NFR-X-005] [NFR-X-006] [REQ-MPC-FR-092] [REQ-MPC-FR-019] |
| Multilingual | All on-screen text is held in language packs and can be translated. KTDA names Kiswahili, English, French, Arabic, Russian and Mandarin; Malawi Post names English and Chichewa as examples. | [NFR-X-004] |
| Secure and private by design | Access limited by role, card data never stored, multi-factor sign-in for privileged roles, personal data handled under each country's data-protection rules, with consent, export, deletion and breach handling. | [NFR-X-001] [NFR-X-002] |
| Configuration, not customisation | Anything that differs between clients is a setting, a configuration pack, a feature switch or a connection. No client-specific changes to the core product (proposed). | [NFR-X-008] |
| Reuse | Every client runs the same product version. Features are grouped as always included, optional packs, or client-specific connections (decision D-01). | Decision D-01 |
| Open, non-proprietary data storage | Malawi Post requires open, non-proprietary data storage and browser-based access. | [REQ-MPC-ARC-003] [REQ-MPC-ARC-002] |
| Credentials kept out of shared settings | Passwords and keys for connected services are entered for each client installation and are never stored in configuration packs (proposed, decision CFG-01). | Decision CFG-01 |

# 6. Key user journeys

Typical end-to-end journeys, in the words of each module. The modules and features named are described in section 7.


## 6.1 Platform foundation and multi-client set-up

- The platform team sets up a new client from one recipe, checks the practice site with the client, records sign-off and then opens the live site.
- A client administrator changes an important setting, an approver checks what it will affect and approves it, and the history shows who changed what.
- A shopper opens the shop on a phone, picks a language and a currency, and shops in the local time zone with the client's own branding.


## 6.2 Accounts, sign-in and access

- A shopper without email signs up with a mobile number, confirms the code sent by SMS, accepts the terms and starts shopping.
- A walk-in customer at a post office is registered by a named agent, who then places an order for them with the agent and outlet recorded.
- A business applies for a trade account, staff approve it, and the company's buyers then see trade prices and share addresses and order history.


## 6.3 Sellers and marketplace

- A business applies to sell, uploads its documents, accepts the seller agreement, passes identity checks and is approved by compliance staff.
- An approved seller registers a payout account, sells through the marketplace and receives a settlement statement and payout on its cycle.
- A seller whose performance falls below a set level receives a warning, and compliance staff decide on further action.


## 6.4 Product catalogue

- A seller creates a listing with the guided form, the platform checks it is complete and allowed, and client staff approve it before it is published.
- A business buyer signs in, sees the company's agreed range and prices, and requests a quote for a bulk item that has no fixed price.
- A shopper browses a category in their own language, compares options, reads reviews and sees when the item will arrive before buying.


## 6.5 Inventory and warehouses

- A shopper sees that a product is in stock, starts checkout, and the item is held for them while they pay; if they do not pay in time, the item is released for others.
- Warehouse staff receive goods against a purchase order, note any shortage or damage, and the accepted goods become available for sale straight away.
- Quality staff find a faulty batch, recall it, and get a list of every customer who received it.


## 6.6 Search, discovery and merchandising

- A shopper types "black tea", picks a suggestion with a picture, narrows the results to in-stock items from a chosen seller, and sorts them by price.
- A shopper in a district without home delivery shows only items available for pickup at a nearby outlet, and sees the expected delivery time on each product card.
- Marketing staff set up a seasonal campaign page with banners and a product carousel that appear and disappear on set dates.


## 6.7 Cart and checkout

- A shopper fills a cart, chooses home delivery for one item and pickup at a post office for another, pays once, and receives a confirmation with one order reference.
- An agent at a post office places an order for a walk-in customer and records that the customer paid in cash.
- A company buyer uploads a spreadsheet of product codes, sends the order to a company approver because it is above their limit, and pays on account once it is approved.


## 6.8 Payments, tax, settlement and reconciliation

- A Kenyan shopper chooses M-Pesa, confirms the payment request on their phone with their PIN, and receives a receipt by email and SMS.
- A shopper in a rural district chooses cash at a post office, receives a secure reference, pays at the counter and gets a printed receipt.
- Finance staff open the daily reconciliation, see which provider payments do not match orders, and resolve each one with a note.


## 6.9 Orders, quotations and contracts

- A shopper places an order, the seller accepts, packs and hands it over, and the shopper follows each stage until delivery and confirms acceptance.
- A business buyer asks several sellers for a price, compares the quotes side by side, negotiates, and accepts one quote, which becomes an order.
- A business buyer requests a forward contract through an online form; after internal approval a contract is drafted, signed electronically and turned into scheduled orders.


## 6.10 Shipping, delivery and fulfilment

- A shopper sees only the delivery and pickup options available at their address, with the fee broken down and an expected delivery range, and chooses one.
- Warehouse staff pick from a shelf-ordered list, check every item at packing, print a barcoded label and confirm dispatch with the carrier.
- A Malawi Post courier works through the day's delivery list, records each attempt, and captures proof of delivery on a phone.


## 6.11 Tracking and customer messages

- A shopper is told when the parcel is shipped, out for delivery and ready for pickup, opens the tracking page from the message, and shares the link with the recipient.
- A guest buyer checks an order status with the order number and phone number, without an account.
- Support staff see that parcels are delayed at one hub, send a notice to every affected customer and show a banner on the tracking page.


## 6.12 Returns, refunds and disputes

- A shopper requests a return with photos, drops the item at an outlet with a return label, and is refunded automatically once staff accept the item on inspection.
- A shopper reports a damaged item; support staff review the evidence, including proof of delivery, propose a remedy, and close the case once the shopper accepts it.
- A buyer and a seller message each other inside a dispute case, and client staff step in as mediator when they cannot agree.


## 6.13 Customer service, help desk and chat

- A shopper reports a missing parcel from the order page, gets a ticket number at once, and the ticket goes straight to the right team with the order details already filled in.
- A customer phones the call centre; the agent logs the call on the customer's ticket, sees orders, payments and tracking on one screen, and resolves the request in one call.
- After the ticket is resolved, the shopper rates the service, and the rating appears on the support manager's dashboard.


## 6.14 Marketing, promotions, loyalty, content and SEO

- Marketing staff create a promo code for a category with start and end dates and a usage limit; a shopper enters it in the cart and sees the discount.
- Content staff edit the returns policy; an approver who is not the author approves it with an effective date, and the earlier version stays on record.
- A registered customer shares a referral link; when the new customer's first order is complete, the referrer receives reward points.


## 6.15 Reporting and analytics

- A manager signs in and sees order and customer figures on the home dashboard, then runs the best-sellers report for the month.
- An executive opens the dashboard of key measures, clicks on a drop in orders and follows it down to the individual orders behind it.
- A monthly operations report is filled in automatically from system figures and e-mailed to the named recipients.


## 6.16 Administration, workflow and operations console

- A client administrator designs a two-step approval for large orders, tests it with sample data, and publishes it without new development.
- A seller changes the payout account; the change waits in an approver's queue, and the old account stays in use until it is approved.
- An operator opens the exception queue, sees the most severe problems first, and clears a group with the same cause in one action.


## 6.17 Documents and records

- A shopper places an order, receives an invoice in their own language with the client's logo and a QR code, and later downloads it again from My account.
- A seller applying to sell uploads the required licences once, the platform checks them at once, and the seller reuses them from their document vault in later applications.
- An auditor selects all documents for a period and downloads them as one package with a record of who opened or changed each one.


## 6.18 Security, audit and compliance

- A visitor arrives, chooses which cookie categories to allow, and analytics tags run only if they accepted them.
- An auditor receives time-limited read-only access, searches the audit trail for a period and exports the results with proof that nothing was changed.
- A privacy officer records a personal-data breach, the platform works out the legal deadlines from the country profile, and the officer notifies the affected people on time.


## 6.19 Connections with other systems

- A shopper pays for an order; the platform posts the sale to the client's finance system and tells the postal system to prepare the parcel, with no re-keying.
- A partner developer reads the documentation in the developer portal, tests in the test area, receives approved access and connects their system.
- A business buyer starts shopping from their organisation's purchasing system, fills a cart and sends it back there for approval; the order arrives later as a purchase order.


## 6.20 Channels: mobile app, installable website, USSD, SMS, WhatsApp and assisted service

- A shopper with a basic phone dials a short code, checks the status of an order and pays for a new one from their mobile-money wallet.
- A shopper sends a WhatsApp message to the business number and is answered by the chat assistant or a support agent in the same conversation.
- An agent at an outlet places an order for a walk-in customer; the order counts for the agent's network and earns commission once paid.


## 6.21 AI capabilities

- A shopper asks the website assistant where their order is, gets the status of their own order, and asks to talk to a person when they need more help.
- A seller asks for a product description and a suggested price, reviews both, and saves only what they accept.
- A content editor asks for translations of a product page, checks them, and a second person approves them before they go live.


## 6.22 Financial products

- A seller sees a loan offer from a partner lender, agrees to share named business data, applies, and later sees repayments deducted from their platform settlements.
- A buyer adds transit insurance at checkout, receives the policy number after payment, and follows a claim in My account if goods are damaged.
- An eligible farmer sees the subsidy for an eligible product in the cart and pays only their share.


## 6.23 e-Government and service catalogue (optional pack)

- A citizen finds a certificate service, uploads the required documents, pays the fee, follows the application status and collects the certificate at a post office.
- An agency officer checks the documents of an application, asks for a clearer copy of one, then approves it and hands the issued document to the delivery network.
- Finance staff group the fees owed to an agency for a period, record the payment to the agency and record the agency's confirmation.


## 6.24 Services commerce (booking, delivery and completion of services)

- A farmer books a spraying service priced per hectare at their farm, pays a deposit, gets a reminder, and confirms the service was delivered so the provider can be paid.
- A shopper buys an e-ticket for a partner service, receives a code and QR code, and outlet staff scan it once to redeem it.
- A business buyer hires equipment for chosen dates, sees the price for that length of hire and only dates on which a unit is free.

# 7. Product capabilities

Every feature of the product, module by module. The facts box gives the delivery phase, whether the feature is always included or part of an optional pack, who it is for, and whether it is planned or depends on a pending decision.

<!-- pagebreak -->

## 7.1 Platform foundation and multi-client set-up

This part of the product is the base that every client site runs on. It lets the platform team set up a new client by choosing ready-made settings rather than writing new code, and keeps each client's data completely separate. It also covers the look of the shop, languages, currencies, monitoring, backups, upgrades and the safeguards that keep data correct.

### PRD-PLT-001 Client site set-up

| Key facts |  |
|---|---|
| Phase | Phase 1 |
| Pack | Always included |
| For | Staff (back office) |
| Availability | Planned for phase 1 |

A ready-made recipe that sets up a new client in one go: a live site and a separate practice (test) site, already loaded with the settings chosen for that client. Each client site has a status with defined behaviour at each stage.

**Who uses it:** Platform team; new clients

**What it does**

- Set up a new client from one recipe that creates a live site and a separate practice site, each with its own data and the same product release.
- Load the settings chosen for that client into both sites as part of set-up.
- Keep the practice site free of real customer, order and payment data; it uses its own connection details for outside services.
- Run a go-live checklist and record each item as passed or failed, with evidence.
- Suspend a client site with a reason: the shop shows a "store closed" page and the client contact is told.
- Archive a client site after a final, verified backup, and later restore it from that backup.

**Rules**

- The practice site becomes active first.
- Proposed, to be confirmed: the live site cannot go active until user acceptance sign-off (reference, signed by, date) is recorded.
- Proposed, to be confirmed: the live site cannot go active while any go-live checklist item has failed.
- Proposed, to be confirmed: if a set-up step fails, the platform team is told which step failed and the live site is not opened.
- Every status change is recorded, and the client contact is told.

**Benefit:** New clients go live by switching things on, not by writing new code, so onboarding is fast and the same every time.

### PRD-PLT-002 Client data separation

| Key facts |  |
|---|---|
| Phase | Phase 1 |
| Pack | Always included |
| For | Staff (back office) |
| Availability | Depends on a pending decision: whether each client has its own installation or clients share one (architecture decision) (ref F-CAT-B) |

Each client gets its own copy of the system and its own data store, so one client's customers, orders and prices can never be seen by another client.

**Who uses it:** Clients; clients' customers

**What it does**

- Give each client its own installation, data store, security keys and picture and file storage, none of them shared with another client.
- Refuse sign-in on one client's shop with an account that exists only on another client's shop.
- Keep a client's retail and trade shops inside that client's own installation; separate shops are never used to separate two clients.
- Give the platform operator a cross-client view that reads only monitoring information (proposed, to be confirmed).

**Rules**

- No customer, order or price of one client is shown by any page or connection of another client.

**Benefit:** Protects every client's business data and makes data-protection compliance simpler.

### PRD-PLT-003 Configuration packs

| Key facts |  |
|---|---|
| Phase | Phase 1 |
| Pack | Always included |
| For | Staff (back office) |
| Availability | Planned for phase 1 |

Pre-packaged sets of settings, such as rules, roles, message wording and product categories, that are layered from global to country, industry and client. A transaction type or a single transaction can make a recorded exception to its client pack where justified.

**Who uses it:** Platform team; client administrators; new clients

**What it does**

- Keep settings in packs at four layers: global, country, industry and client, plus entries for a single shop.
- Apply a client's set of packs to a site in one step and record which packs and versions were applied, by whom and when.
- Check a pack before it is applied and stop if it names an unknown setting, permission or shop.
- Load roles, message wording, email templates, categories, feature switches, workflows and rules from the pack.
- Let a client administrator set an exception for one transaction type, or one transaction, with a reason; each exception is recorded as a change from the pack.
- Proposed, to be confirmed: list settings changed on the site since the last pack, so the platform team chooses to keep the site value or take the pack value.

**Rules**

- A client value wins over an industry value, an industry value over a country value, and a country value over a global value.
- Passwords and secret keys are never held in a pack; a pack that contains one is refused.
- An exception for a single transaction is refused without a reason.
- Proposed, to be confirmed: applying a pack either fully succeeds or changes nothing; applying the same pack again changes nothing.
- Proposed, to be confirmed: each pack set holds exactly one country pack (for example Kenya or Malawi).

**Benefit:** This is the main tool that lets a new client be set up by choosing options rather than by new development.

### PRD-PLT-004 Settings change control

| Key facts |  |
|---|---|
| Phase | Phase 1 |
| Pack | Always included |
| For | Staff (back office) |
| Availability | Depends on a pending decision: whether the workflow engine is built or an existing product is embedded (architecture decision) (ref WF-ENG) |

Changes to important settings are checked when saved, show in advance what they will affect, need approval, keep a history of old and new values, and can be undone. Two versions of the settings can be compared side by side.

**Who uses it:** Client administrators; configuration approvers; auditors; platform team

**What it does**

- Check important settings when they are saved and refuse invalid values, leaving the live value unchanged.
- Hold a change to an important setting for approval and preview what it affects, for example the number of open orders using a payment method.
- Approve or reject a pending change; a rejection needs a reason and the requester is told.
- Show a history of every settings change with who, when, old and new value, reason and approvers, and export a change report for a period.
- Undo a change by returning selected settings to an earlier version, through the same checks and approval.
- Show the settings as they were on a past date.
- Compare two versions of the settings side by side and copy selected differences into a new change.

**Rules**

- A requester cannot approve their own change.
- Proposed, to be confirmed: a high-impact change needs approval by two different approvers.
- Proposed, to be confirmed: if a setting changed again after the request was made, the change is not applied and is marked out of date.
- On the practice site, valid changes apply at once without approval and are still recorded.

**Benefit:** Stops accidental or unauthorised changes from breaking the live shop, and shows who changed what.

### PRD-PLT-005 Settings export, import and promotion

| Key facts |  |
|---|---|
| Phase | Phase 1 |
| Pack | Always included |
| For | Staff (back office) |
| Availability | Planned for phase 1 |

A site's settings can be saved to a file, loaded into another site, and moved from the practice site to the live site once checked.

**Who uses it:** Platform team; client administrators

**What it does**

- Export a site's settings to a file with a summary of where and when it was made.
- Load an exported file into another site, with the same checks as a pack.
- Promote checked changes from the practice site to the live site; the differences become a change that follows normal approval.
- Start a new client from a copy of another client's settings, with recorded permission (proposed, to be confirmed).

**Rules**

- Passwords and secret keys are never exported; they are listed by name only, to be entered on the target site.
- Customer, order and product records are not part of a settings export.
- Proposed, to be confirmed: a file from a newer product release cannot be loaded into a site on an older release.
- Proposed, to be confirmed: a copy for a new client leaves out names, addresses, logos, email accounts and secrets of the original client.

**Benefit:** Changes are tried safely first and then copied to live without retyping them.

### PRD-PLT-006 Branding and look

| Key facts |  |
|---|---|
| Phase | Phase 1 |
| Pack | Always included |
| For | Staff (back office) |
| Availability | Planned for phase 1 |

The client chooses its logo, colours, fonts and page layout so the shop looks like the client's own brand; each storefront can look different.

**Who uses it:** Client administrators; shoppers

**What it does**

- Set the logo for each storefront.
- Apply the client's colours and fonts to every page of a storefront, with no change to product code.
- Give each storefront of a client its own look.
- Use the same branding on invoices and system emails.

**Rules**

- Shoppers can choose a look only if the client allows it.

**Benefit:** Customers recognise and trust the brand, and no design code is needed per client.

### PRD-PLT-007 Own web address and security certificate

| Key facts |  |
|---|---|
| Phase | Phase 1 |
| Pack | Always included |
| For | Staff (back office) |
| Availability | Planned for phase 1 |

The shop runs on the client's own web address, for example shop.client.com, with the padlock security certificate in the browser.

**Who uses it:** Clients; shoppers

**What it does**

- Run each storefront on one or more of the client's own web addresses.
- Move every visit to the secure (padlock) version of the address.

**Rules**

- Every client storefront uses the secure address.

**Benefit:** Customers see a trusted, secure address that belongs to the client.

### PRD-PLT-008 Email sender identity

| Key facts |  |
|---|---|
| Phase | Phase 1 |
| Pack | Always included |
| For | Staff (back office) |
| Availability | Planned for phase 1 |

System emails, such as order confirmations, are sent from the client's own email address and set up so they are not marked as spam.

**Who uses it:** Clients; shoppers

**What it does**

- Send system emails from the client's own address and display name.
- Send selected emails from a different client address where a template names one.
- Send a test email to confirm delivery and spam checks as part of go-live.

**Rules**

- Email account passwords are never included in a settings export.

**Benefit:** Customers receive and trust the emails.

### PRD-PLT-009 Languages and address places

| Key facts |  |
|---|---|
| Phase | Phase 1 |
| Pack | Always included |
| For | Staff (back office) |
| Availability | Planned for phase 1 |

The shop can be shown in several languages, including right-to-left languages such as Arabic, and visitors pick their language. Countries, regions and districts used in addresses are maintained in the same admin area.

**Who uses it:** Shoppers; client administrators

**What it does**

- Let shoppers choose from the languages published for that storefront.
- Show the shop in Kiswahili, English, French, Arabic, Russian and Mandarin for KTDA, and in English and Chichewa for Malawi Post, once translations are loaded.
- Lay out the shop right to left for languages such as Arabic.
- Show the main language where a translation is missing, and report the gap.
- Maintain countries and load the regions or districts each country uses in addresses.

**Benefit:** People can shop in the language they understand best.

### PRD-PLT-010 Currencies and exchange rates

| Key facts |  |
|---|---|
| Phase | Phase 1 |
| Pack | Always included |
| For | Staff (back office) |
| Availability | Planned for phase 1 |

The shop can show and charge prices in more than one currency, with one main currency for accounting. Rates can be typed in, or come automatically from the exchange-rate connection.

**Who uses it:** Shoppers; business buyers; finance staff

**What it does**

- Let shoppers pick a currency and see prices and totals in it, formatted and rounded for that currency.
- Keep one main currency for accounting; orders in other currencies also keep the currency and rate used.
- Let staff type in a rate, which applies to prices shown after it is saved.
- Take automatic rates from the exchange-rate connection (PRD-PLT-024).

**Rules**

- Where US dollars is the main currency, all reports and order totals use US dollars as the base.

**Benefit:** International and local buyers see prices in a currency they understand.

### PRD-PLT-011 Time zone and formats

| Key facts |  |
|---|---|
| Phase | Phase 1 |
| Pack | Always included |
| For | Staff (back office) |
| Availability | Planned for phase 1 |

Sets the shop's local time zone and how dates, times and numbers are written.

**Who uses it:** All users

**What it does**

- Show order times and other times in the shop's time zone, or in the shopper's own time zone if the client allows it.
- Write dates and numbers in the format of the chosen language.

**Benefit:** Order times, deadlines and reports show the correct local time.

### PRD-PLT-012 Financial year for reporting

| Key facts |  |
|---|---|
| Phase | Phase 2 |
| Pack | Always included |
| For | Staff (back office) |
| Availability | Planned for phase 2 |

Lets the client set when its financial year starts so reports group figures by the client's own financial periods.

**Who uses it:** Finance staff; management

**What it does**

- Set the month and day the financial year starts.
- Group report figures into financial periods that start on that date, in the shop's time zone.
- Proposed, to be confirmed: regroup past figures when the start date changes, with the change kept in the settings history.

**Rules**

- Each order date falls in exactly one financial period.

**Benefit:** Finance reports match the client's accounting year.

### PRD-PLT-013 Several shops for one client (trade and retail)

| Key facts |  |
|---|---|
| Phase | Phase 1 |
| Pack | Always included |
| For | Staff (back office) |
| Availability | Planned for phase 1 |

One client can run several shops from the same system, for example a retail shop for the public and a trade shop for business buyers, each with its own products, prices, look, payment and delivery rules.

**Who uses it:** Client administrators; shoppers; business buyers

**What it does**

- Run a retail shop and a trade shop from one installation, each on its own web address.
- Show a product only in the shop it is assigned to.
- Show business buyers the trade range and the prices for their role in the trade shop.
- Offer retail, bulk, contract-packaging and forward-contract sales in the shops they are set up for.
- Give each shop its own value for a setting, such as look, payment methods or delivery rules; other shops use the shared value.

**Benefit:** Serves business (B2B) and retail (B2C) customers without running two systems.

### PRD-PLT-014 Site health and service-level monitoring

| Key facts |  |
|---|---|
| Phase | Phase 1 |
| Pack | Always included |
| For | Staff (back office) |
| Availability | Planned for phase 1 |

Dashboards and alerts that show whether each client's site is up, how fast it is, and whether agreed service levels are met. The platform operator also has a staff-only view that compares health and usage across all clients.

**Who uses it:** Platform team; clients

**What it does**

- Show page views, calls from other systems, error rates and response times per client site.
- Show how fast key steps are, such as search, checkout and payment confirmation, over a chosen period.
- Raise alerts to named people when a measure crosses a set limit.
- Report the health of the site's main parts without any personal data (proposed, to be confirmed).
- Give platform staff one view of health and usage across all clients.

**Rules**

- Client staff cannot open the cross-client view.
- Alert limits are client settings.

**Benefit:** Problems are spotted and fixed before customers notice.

### PRD-PLT-015 Scalable, open design

| Key facts |  |
|---|---|
| Phase | Phase 1 |
| Pack | Always included |
| For | Staff (back office) |
| Availability | Planned for phase 1 |

The system is built to grow: more servers can be added when traffic rises, it runs on Windows or Linux, it uses an open data store, and new modules are added without changing the core.

**Who uses it:** Platform team; clients

**What it does**

- Run a site on more than one web server, with shared storage, when traffic rises.
- Add a new product module without changing the core product.
- Run on Amazon Web Services or Microsoft Azure with no dependency on one cloud provider.
- Keep the data store on a separate server from the application servers.
- Run on open data stores (PostgreSQL, or MySQL version 8 or newer) as well as Microsoft SQL Server, and on Windows Server 2019 or newer with Microsoft .NET 10, which the current product base needs.

**Benefit:** The shop stays fast as it grows and is not locked to one vendor.

### PRD-PLT-016 Backup and disaster recovery

| Key facts |  |
|---|---|
| Phase | Phase 1 |
| Pack | Always included |
| For | Staff (back office) |
| Availability | Planned for phase 1 |

Regular automatic backups, tested restores, and a plan to bring the shop back quickly if a server or data centre fails.

**Who uses it:** Clients; shoppers; auditors

**What it does**

- Take scheduled backups of data and files while the shop keeps trading.
- Restore the shop on a recovery site from the latest backup and record the time taken and any data lost.
- Report each backup (time, size, success or failure) and the date and result of the last restore test.
- Raise an alert when a backup fails.

**Rules**

- Where an open data store is used, backups come only from the outside backup service.

**Benefit:** Orders and customer data are not lost, and downtime is kept short.

### PRD-PLT-017 Mobile-friendly shop

| Key facts |  |
|---|---|
| Phase | Phase 1 |
| Pack | Always included |
| For | Staff (back office) |
| Availability | Planned for phase 1 |

The shop adjusts itself to work well on mobile phones, tablets and computers.

**Who uses it:** Shoppers

**What it does**

- Fit pages to phone, tablet and computer screens with no sideways scrolling.
- Let shoppers browse, search, add to the basket and check out in current Android and iOS phone browsers.
- Keep every menu, button and entry box usable at phone size.

**Rules**

- Proposed, to be confirmed: screen widths tested are 360, 768 and 1280 pixels.

**Benefit:** Both clients require the shop to work on phones, tablets and computers.

### PRD-PLT-018 Accessibility

| Key facts |  |
|---|---|
| Phase | Phase 1 |
| Pack | Always included |
| For | Staff (back office) |
| Availability | Planned for phase 1 |

The shop and the staff screens follow the international accessibility standard (WCAG 2.1 AA), so people with disabilities, for example people using screen readers, can use them. Users can switch to high contrast and larger text.

**Who uses it:** Shoppers and staff with disabilities

**What it does**

- Check every new or changed screen against WCAG 2.1 AA, by tool and by hand with a keyboard and screen reader.
- Let shoppers switch on high contrast or larger text on every page.
- Remember the choice for a signed-in shopper, or for the visit for a guest.

**Rules**

- No level A or AA failure stays open at the end of a delivery increment.

**Benefit:** Includes everyone and meets public-sector accessibility expectations.

### PRD-PLT-019 On-screen help and guided tours

| Key facts |  |
|---|---|
| Phase | Phase 1 |
| Pack | Access and administration extensions pack (optional) |
| For | Staff (back office) |
| Availability | Planned for phase 1 |

Short help tips on each screen and step-by-step guided tours for new buyers, sellers and staff.

**Who uses it:** New buyers, sellers and staff; client administrators

**What it does**

- Show help tips for a screen and role, in the user's language.
- Start a guided tour once at a user's first sign-in; the user can skip it and replay it later.
- Let administrators write tips, tour steps and links to training material per language, without a new release.
- Keep the standard first-run steps and help links in the staff area.

**Benefit:** People learn the system without training sessions and make fewer mistakes.

### PRD-PLT-020 Record keeping and archiving

| Key facts |  |
|---|---|
| Phase | Phase 1 |
| Pack | Always included |
| For | Staff (back office) |
| Availability | Planned for phase 1 |

Rules for how long each kind of record, such as orders, payments, support tickets and logs, is kept, when it is archived and when it is deleted or anonymised.

**Who uses it:** Client administrators; regulators

**What it does**

- Set, per kind of record, how long it is kept and whether it is then archived, anonymised or deleted.
- Run the rules on a schedule and log how many records were handled each time.
- Archive records with a verified copy before removing them from the live system.
- Set retention for tracking history: kept active, then archived and still searchable by staff, then deleted.
- Proposed, to be confirmed: offer rules for every kind of record the product keeps, such as documents, support tickets, sign-in history, returns and disputes, chat transcripts and the audit trail.

**Rules**

- Proposed, to be confirmed: a record under legal hold, or linked to an open payment, refund, dispute or amount owed, is never removed.
- Proposed, to be confirmed: audit history is only archived or removed in whole closed blocks, never entry by entry.
- Retention periods are not yet set; each client sets them.

**Benefit:** Meets legal record-keeping and data-protection rules and keeps the system tidy.

### PRD-PLT-021 Product release and upgrades

| Key facts |  |
|---|---|
| Phase | Phase 1 |
| Pack | Always included |
| For | Staff (back office) |
| Availability | Planned for phase 1 |

A managed way to release new versions of the product and upgrade every client's site safely, including checks that each client's settings and add-on modules still work.

**Who uses it:** Platform team; all clients

**What it does**

- Deploy a new release to the practice site first and to the live site only after the regression tests pass there.
- Record the release version on each site.
- Check after an upgrade that add-on modules and the client's settings still work, and show any problem as a warning and in the upgrade report.
- Carry each client's existing settings forward automatically when moving to the current product base, and flag any setting name that changed.
- Proposed, to be confirmed: roll back to the earlier release and backup if a check fails on the live site.

**Rules**

- Every add-on module, including those bought from outside suppliers, must have a version made for the current product base; one without it is not loaded and holds back the release of the features that need it.

**Benefit:** Keeps all clients on one product instead of each drifting into its own custom copy.

### PRD-PLT-022 Feature switchboard

| Key facts |  |
|---|---|
| Phase | Phase 1 |
| Pack | Always included |
| For | Staff (back office) |
| Availability | Planned for phase 1 |

A master switchboard listing every product feature, with on and off switches per client and per shop.

**Who uses it:** Platform team; client administrators

**What it does**

- List every product feature with its state for the client and for each shop.
- Switch a feature on or off for the client or for one shop; every change is recorded.
- Hide a switched-off feature's pages and actions in that shop (proposed, to be confirmed).

**Rules**

- A feature cannot be switched on while a feature it depends on is off.
- Features of the platform core are always on.
- A shop setting wins over the client setting; with neither set, the feature is off.

**Benefit:** Turning a feature on for a client is a setting, not a development job.

### PRD-PLT-023 Client data move toolkit

| Key facts |  |
|---|---|
| Phase | Phase 1 |
| Pack | Always included |
| For | Staff (back office) |
| Availability | Planned for phase 1 |

Tools to bring a new client's existing data, such as customers, addresses, open orders, order history, loyalty points and gift cards, into the system, with checks and a report showing nothing was lost.

**Who uses it:** New clients; platform team

**What it does**

- Run a trial load that checks every row and lists rejected rows with reasons, without saving anything.
- Load customers, addresses, open orders, order history, loyalty-point balances and gift-card balances.
- Load agreed customer and customer-group prices from a spreadsheet using the built-in price-list import.
- Produce a check report per kind of record: source count, loaded count, rejected count, and money totals before and after, with differences highlighted.
- Proposed, to be confirmed: run a load again without creating duplicates.

**Rules**

- Old passwords are kept only where the client allows it and the format matches; otherwise customers reset their password.

**Benefit:** Clients can move from an old system without re-typing data or losing history.

### PRD-PLT-024 Exchange-rate sources

| Key facts |  |
|---|---|
| Phase | Phase 1 |
| Pack | Always included |
| For | Staff (back office) |
| Availability | Planned for phase 1 |

Connects to sources of official or commercial exchange rates for currencies such as the Kenyan shilling and Malawian kwacha, which the built-in rate source does not cover, and updates rates on a schedule.

**Who uses it:** Finance staff; shoppers

**What it does**

- Choose a rate source and update rates automatically on a schedule.
- Proposed, to be confirmed: leave rates unchanged and log the error when the source is unavailable.
- Proposed, to be confirmed: hold back a new rate that moves more than a set tolerance and log it for finance staff.

**Benefit:** Prices in other currencies stay accurate without manual updates.

### PRD-PLT-025 Translation management

| Key facts |  |
|---|---|
| Phase | Phase 1 |
| Pack | Always included |
| For | Staff (back office) |
| Availability | Planned for phase 1 |

Tools to send all screen text and product content out for translation, bring translations back in, and track which translations are checked.

**Who uses it:** Content staff; translators; reviewers

**What it does**

- Export one file per language with all screen text and product content, showing the source and current translation.
- Import translated files; imported text is marked unchecked.
- Show, per language, the share of text translated and checked.
- Let a reviewer mark a translation as checked, with name and date.
- Mark machine pre-translations (Google Translate or DeepL) as unchecked.
- Proposed, to be confirmed: mark a checked translation unchecked again when its source text changes.

**Rules**

- Translation service keys are never included in a settings export.

**Benefit:** Makes running the shop in several languages manageable.

### PRD-PLT-026 Hosting size profile

| Key facts |  |
|---|---|
| Phase | Phase 1 |
| Pack | Always included |
| For | Staff (back office) |
| Availability | Depends on a pending decision: whether the stated Malawi Post server size is a minimum or a maximum (Malawi Post) (ref C-SIZE) |

A written description of the server size each type of deployment needs. Malawi Post stated 4 processor cores, 8 GB memory and 2 TB storage for the first six months.

**Who uses it:** Platform team; clients

**What it does**

- List every hosted component and its resource needs for a single-server or multi-server deployment.
- Compare the planned components with the Malawi Post figures (4 cores at 2.0 GHz, 8 GB memory, 2 TB storage, cloud hosting for the first six months).
- Show the final sizing once it is decided whether the Malawi Post figures are a minimum or a maximum.

**Benefit:** Hosting is sized correctly, and conflicts with heavier components are visible early.

### PRD-PLT-027 Data consistency safeguards

| Key facts |  |
|---|---|
| Phase | Phase 2 |
| Pack | Always included |
| For | Staff (back office) |
| Availability | Planned for phase 2 |

When two people or systems change the same record at the same time, the platform prevents one change from silently overwriting the other. A change sent twice, for example after a network drop, is carried out only once.

**Who uses it:** All users; IT teams; integrators

**What it does**

- Refuse a save when someone else changed the same record after it was opened, and show the current values.
- Carry out a repeated change request only once and return the first result.
- Proposed, to be confirmed: refuse a repeated request key sent with different content.
- Proposed, to be confirmed: refuse any change request from another system that does not carry a unique request key.

**Benefit:** Data stays correct when many users and systems work at once, especially on unreliable networks.

<!-- pagebreak -->

## 7.2 Accounts, sign-in and access

This part of the product covers how shoppers, business buyers, agents and staff get an account, sign in and stay safe. It controls what each person can see and do, records sign-in activity, and gives customers control over their own details, consents and privacy. It also supports company accounts for business buyers and assisted service by agents at outlets such as post offices.

### PRD-IAM-001 Customer registration and sign-in

| Key facts |  |
|---|---|
| Phase | Phase 1 |
| Pack | Always included |
| For | Business buyers and shoppers |
| Availability | Planned for phase 1 |

Customers create an account with their email address and a password and sign in. A guest who registers in the same visit keeps the basket and any guest order.

**Who uses it:** Shoppers; guest shoppers; members of the public; client administrators

**What it does**

- Register with an email address and a password that meets the password rules, and receive a welcome email.
- Sign in with email and password; with a second sign-in check switched on, that step follows.
- See saved addresses and earlier orders in My account when signing in again.
- Keep the guest basket and guest order on the new account when registering in the same visit.
- Let the client choose how new accounts start: at once, after email confirmation, after staff approval, or not at all.
- Let members of the public register for the retail shop with name, email and password only, without any company details.

**Rules**

- An email address belongs to one account only; a second registration with it is refused.
- Registration and sign-in from an email, phone number or network address on the block list are refused.
- A wrong password is refused and counts towards the temporary lock (PRD-IAM-003).

**Benefit:** Customers can track orders and reorder easily.

### PRD-IAM-002 Mobile-number accounts with one-time codes

| Key facts |  |
|---|---|
| Phase | Phase 1 |
| Pack | Always included |
| For | Business buyers and shoppers |
| Availability | Planned for phase 1 |

Customers can sign up and sign in with their mobile phone number, confirmed by a one-time code sent by SMS, and recover their account by SMS.

**Who uses it:** Shoppers; client administrators

**What it does**

- Sign up with a mobile number and a one-time code sent by SMS, with no email address needed.
- Sign in with the mobile number and a one-time code; this sign-in comes ready-made with the current product base, and an outside text-message service chosen by the client sends the codes.
- Reach the same account by email and password or by mobile number and code, where the customer has both.
- Recover access by SMS code when unable to sign in.
- Let the client choose which sign-in methods buyers are offered: password, SMS code or either.

**Rules**

- A number already in use cannot be registered again; the visitor is offered the sign-in link.
- Numbers are stored in international format.
- Too many wrong sign-in codes lock that code; a customer locked out for wrong passwords, or staff who must use a second check, cannot get in with a code alone (proposed, to be confirmed).
- A code expires after its validity period, and too many wrong entries or too many code requests stop further codes until a waiting time has passed; the client sets these values once for all codes.
- Numbers should be entered with the country code (for example +254 or +265); the product adds it where a local number is typed (proposed, to be confirmed).
- Which text-message service is used, and whether the ready-made Twilio option is acceptable and reaches Kenyan and Malawian networks, is still to be confirmed by each client.
- Proposed, to be confirmed: for staff in sensitive roles, an SMS code alone does not restore access.

**Benefit:** Malawi Post requires sign-up with a mobile number, and customers without email can still have an account.

### PRD-IAM-003 Password rules, temporary lock and recovery

| Key facts |  |
|---|---|
| Phase | Phase 1 |
| Pack | Always included |
| For | Business buyers and shoppers |
| Availability | Planned for phase 1 |

Rules for password strength and expiry, a temporary lock after too many wrong attempts, and password reset by email. Recovery of sensitive accounts needs extra checks such as security questions or confirmation by a manager.

**Who uses it:** All users; client administrators

**What it does**

- Set password length, character rules, how many old passwords cannot be reused, and how long a password lasts.
- Lock an account for a set time after a set number of wrong passwords, and email the owner about failed attempts if the client chooses.
- Let a user reset their password through a one-time email link that expires.
- Sign out other sessions after a password change, if the client chooses.
- Require security questions or a manager's confirmation before a sensitive account can be recovered.

**Rules**

- A reset link works only once and only for a set number of days.
- Sensitive accounts get no reset link by email alone; the same neutral message is shown as for other accounts.
- The reset page never reveals whether an email address is registered.
- A person cannot confirm their own recovery request.

**Benefit:** Protects accounts from being guessed or stolen.

### PRD-IAM-004 Second sign-in check by role

| Key facts |  |
|---|---|
| Phase | Phase 1 |
| Pack | Always included |
| For | Business buyers and shoppers |
| Availability | Planned for phase 1 |

Staff in sensitive roles must pass a second check when signing in: a code from an authenticator app, a code sent by email or SMS, or a hardware security key. Buyers can also switch on a second check for their own account.

**Who uses it:** Client staff; client administrators; buyers

**What it does**

- Name the roles that must use a second check; members cannot continue until they set one up.
- Use an authenticator app, an email code, an SMS code or a hardware security key as the second check.
- Let buyers switch on a second check in My account and choose the method.
- Make a staff member set up the second check again after an administrator removes it; the removal is recorded.

**Rules**

- The second check is required by role, not for every shopper.
- Proposed, to be confirmed: a member of a role that requires the second check cannot switch it off.

**Benefit:** Protects admin and finance accounts even if a password is stolen.

### PRD-IAM-005 Single sign-on for staff and business buyers

| Key facts |  |
|---|---|
| Phase | Phase 2 |
| Pack | Always included |
| For | Business buyers and shoppers |
| Availability | Planned for phase 2 |

Staff and business buyers sign in with the account they already use at work, for example Microsoft or Google, instead of a separate password. Accounts are created and disabled automatically when people join or leave.

**Who uses it:** Client staff; client IT administrators; business buyers

**What it does**

- Sign staff in through the organisation's sign-in service (OpenID Connect or SAML 2.0) and match them to their existing account.
- Create accounts with roles matched to directory groups when the organisation adds a person.
- Disable an account and end its open sessions when the organisation removes a person.
- Record sign-in errors from the work sign-in service, if the client chooses.
- Proposed, to be confirmed: let a company buyer sign in through their own company's sign-in service and link them to that company.

**Rules**

- Proposed, to be confirmed: staff accounts are not created by signing in alone.
- Proposed, to be confirmed: where a role requires a second check, the platform asks for one unless the work sign-in service already did one.

**Benefit:** Fewer passwords, and the client's IT team controls access centrally.

### PRD-IAM-006 Session control

| Key facts |  |
|---|---|
| Phase | Phase 1 |
| Pack | Always included |
| For | Business buyers and shoppers |
| Availability | Planned for phase 1 |

Automatic sign-out after inactivity, limits on signing in from many places at once, and the ability to force someone off the system.

**Who uses it:** All users; client administrators; security officers

**What it does**

- Sign users out after a set idle time, with different times for staff and buyers.
- Keep an active session going while the user keeps working.
- Let a security officer force a user off at once, ending all of their sessions; this is recorded.
- Start a new session after a password change, a second-check change or a new role.
- Proposed, to be confirmed: limit how many sessions one user can have, either ending the oldest or refusing the new sign-in.
- Proposed, to be confirmed: end one chosen session while the user's other sessions continue.

**Rules**

- Proposed, to be confirmed: "remember me" does not keep a session alive past the idle time.

**Benefit:** Reduces the risk of someone using an unattended or stolen session.

### PRD-IAM-007 Roles and permissions

| Key facts |  |
|---|---|
| Phase | Phase 1 |
| Pack | Always included |
| For | Business buyers and shoppers |
| Availability | Planned for phase 1 |

Defines what each type of user, such as customer, seller, staff and administrator, can see and do, including custom roles and which products each group can see.

**Who uses it:** Client administrators

**What it does**

- Create roles and tick exactly the permissions each role has, without code.
- Give staff access by role only, with separate rights to view and to change each area.
- Limit which products, categories, brands, content pages and menus each role can see.
- Give one user several roles; the user gets the combined access of those roles.
- Set up one role per KTDA stakeholder group once those groups are confirmed.
- Proposed, to be confirmed: keep the roles that product modules rely on, such as Finance, Risk and Agent, in place with fixed names.

**Rules**

- Only users with the right to manage permissions can change a role's permissions.
- A role with view rights only cannot save changes in that area.
- Proposed, to be confirmed: some permissions are never given to certain roles, for example sellers never see return requests.

**Benefit:** People only see and do what their job needs.

### PRD-IAM-008 Limited-scope permissions

| Key facts |  |
|---|---|
| Phase | Phase 1 |
| Pack | Always included |
| For | Business buyers and shoppers |
| Availability | Planned for phase 1 |

Limits a person's permissions to a part of the business, for example one shop, one region, one category, orders up to a certain value, or a time window.

**Who uses it:** Client administrators; branch, factory and regional staff; agents

**What it does**

- Limit a person to the orders of one shop.
- Limit a person to the records of one region, for example a KTDA factory or regional unit.
- Limit product editing to one category.
- Limit approvals to items up to a set value.
- Limit a permission to a time window.
- Proposed, to be confirmed: limit an agent to the orders of their own outlet.

**Rules**

- Proposed, to be confirmed: an attempt to open a record outside the person's scope is refused and recorded.

**Benefit:** Large organisations with branches or factories can delegate safely.

### PRD-IAM-009 Handing over approval rights

| Key facts |  |
|---|---|
| Phase | Phase 2 |
| Pack | Access and administration extensions pack (optional) |
| For | Business buyers and shoppers |
| Availability | Planned for phase 2 |

A manager can hand over approval rights to someone else for a fixed period, for example while on leave, with a record kept.

**Who uses it:** Approvers; auditors

**What it does**

- Hand over a permission to a colleague from a start date to an end date.
- End the handover automatically on the end date, with no manual step.
- Show the colleague the approver's waiting items during the period.
- Record every handover when it is created, cancelled or ends.
- Proposed, to be confirmed: record actions taken under a handover with both the person acting and the person they act for.

**Rules**

- Only permissions marked as transferable can be handed over.
- A person cannot approve an item they requested themselves, even under a handover.

**Benefit:** Work keeps moving when people are away, with accountability.

### PRD-IAM-010 User administration

| Key facts |  |
|---|---|
| Phase | Phase 1 |
| Pack | Always included |
| For | Staff (back office) |
| Availability | Planned for phase 1 |

A screen for staff to find users, view their details, activate or deactivate them and, when helping them, see the shop as they see it, with every action recorded. Customers can deactivate their own account and later reactivate it.

**Who uses it:** Support staff; user administrators; shoppers; auditors

**What it does**

- Search users by email, name, phone, company, role, registration date or last activity, and open their details.
- Deactivate and reactivate accounts without deleting data; a deactivated user cannot sign in.
- Let an administrator see the shop as a customer sees it, with the start recorded for both people.
- Let shoppers deactivate their own account after confirming with a password or code, and reactivate it later with a code.
- Record staff changes to customer records, roles and addresses with old and new values.
- Proposed, to be confirmed: record each time staff open a customer's record, order or address.

**Rules**

- Staff who are not administrators cannot view the shop as an administrator.
- Self-deactivation deletes no data and stops marketing messages.
- Proposed, to be confirmed: an account deactivated by staff cannot be reactivated by its owner, who is asked to contact support.

**Benefit:** Support staff can solve customer problems quickly and safely.

### PRD-IAM-011 Staff invitations and access reviews

| Key facts |  |
|---|---|
| Phase | Phase 1 |
| Pack | Always included |
| For | Staff (back office) |
| Availability | Planned for phase 1 |

Staff are invited by email, and managers regularly confirm that each person still needs their access. Administrators can run access reports showing role assignments, privileged accounts and each user's second-check status.

**Who uses it:** Client administrators; managers; auditors

**What it does**

- Invite staff by email with chosen roles; the invitee sets a password, sets up the second check where required and accepts the terms before first use.
- Run an access review in which each reviewer marks every member of their roles as keep or remove.
- Run an access report showing each user's roles, whether they hold privileged access, second-check status, last sign-in and whether active.
- Show only privileged accounts in the report, and export it to a spreadsheet (CSV or Excel).

**Rules**

- An invitation link works once and only for a set number of days.
- Every review decision is recorded.
- Proposed, to be confirmed: undecided review items become overdue and are listed to administrators; no role is removed automatically.

**Benefit:** Removes access that is no longer needed, a common audit requirement.

### PRD-IAM-012 Sign-in records and suspicious sign-in alerts

| Key facts |  |
|---|---|
| Phase | Phase 1 |
| Pack | Always included |
| For | Staff (back office) |
| Availability | Planned for phase 1 |

Records every sign-in and failed sign-in and flags unusual patterns, such as many failed attempts or sign-ins from unexpected countries. The records can feed a security monitoring system.

**Who uses it:** Security team; security officers; auditors

**What it does**

- Record sign-ins, failed sign-ins, sign-outs, second checks, password changes, role changes and refused access, with time, network address and outcome.
- Flag an account or network address with more than a set number of failures in a set time, and notify the security officer.
- Flag a sign-in from a country not seen for that customer recently, and tell the customer if the client chooses.
- Search the records by date, customer, network address and outcome, and export them.
- Send the records to the client's security monitoring system (PRD-SEC-005).
- Proposed, to be confirmed: let the security officer confirm a flag and force the user off, or dismiss it with a reason.

**Rules**

- No one, including administrators, can change or delete a sign-in record.

**Benefit:** Detects account takeover attempts early.

### PRD-IAM-013 Passwordless and fingerprint or face sign-in

| Key facts |  |
|---|---|
| Phase | Phase 2 |
| Pack | Access and administration extensions pack (optional) |
| For | Business buyers and shoppers |
| Availability | Planned for phase 2 |

Users sign in with a fingerprint, face recognition or device security key (a passkey) instead of a password.

**Who uses it:** Shoppers; staff

**What it does**

- Register a passkey on a supported device, and see or remove it in My account.
- Sign in with the passkey without a password.
- Proposed, to be confirmed: keep password and one-time code sign-in available on devices without passkey support.
- Proposed, to be confirmed: count a passkey that checks the person on the device as the second sign-in check.

**Benefit:** Faster and safer sign-ins.

### PRD-IAM-014 Customer profile and address book

| Key facts |  |
|---|---|
| Phase | Phase 1 |
| Pack | Always included |
| For | Business buyers and shoppers |
| Availability | Planned for phase 1 |

Customers manage their personal details and save several delivery addresses, choosing a default.

**Who uses it:** Shoppers

**What it does**

- Update name, phone and email; an email change is confirmed again where the client uses email confirmation.
- Add, edit and delete delivery addresses.
- Mark one address as the default, shown first and pre-selected at checkout.
- Reuse saved addresses at checkout without retyping.
- Proposed, to be confirmed: change a sign-in mobile number only after confirming a code sent to the new number.

**Benefit:** Faster checkout and fewer delivery mistakes.

### PRD-IAM-015 Preferred pickup point and contact method

| Key facts |  |
|---|---|
| Phase | Phase 1 |
| Pack | Postal and logistics pack (optional) |
| For | Business buyers and shoppers |
| Availability | Planned for phase 1 |

Customers save a preferred pickup point, such as a post office, and how they want to be contacted: SMS, email or app.

**Who uses it:** Shoppers

**What it does**

- Save a preferred pickup point, which checkout then pre-selects.
- Choose a preferred contact method from the methods the client has set up.
- Use that contact method for every message that has no message-specific choice.
- Proposed, to be confirmed: clear the preference and ask for a new choice when the pickup point closes.

**Rules**

- Proposed, to be confirmed: the app is offered as a contact method only where the shop has an app.

**Benefit:** Orders go where the customer wants and messages arrive the way they prefer.

### PRD-IAM-016 Terms acceptance with versions

| Key facts |  |
|---|---|
| Phase | Phase 1 |
| Pack | Always included |
| For | Business buyers and shoppers |
| Availability | Planned for phase 1 |

Records when each customer accepted the terms of use and privacy policy, and asks them to accept again when a new version needs it.

**Who uses it:** Shoppers; sellers; support staff; clients; regulators

**What it does**

- Require acceptance of the current terms and privacy policy at registration by web, mobile number or agent.
- Record the policy, version, time, channel, network address and any agent for each acceptance.
- Ask users to accept again when a new version that requires it is published; they can still sign out and read the policies.
- Let authorised support staff see, read-only and in time order, when a customer accepted each version and gave or withdrew each consent.
- Proposed, to be confirmed: ask approved sellers to accept new seller terms before using the seller portal.

**Rules**

- Registration cannot be completed without acceptance.
- Proposed, to be confirmed: a user who declines a new version is signed out and can only sign in again by accepting.

**Benefit:** Provides proof of consent for legal purposes.

### PRD-IAM-017 Privacy rights

| Key facts |  |
|---|---|
| Phase | Phase 1 |
| Pack | Always included |
| For | Business buyers and shoppers |
| Availability | Planned for phase 1 |

Customers can give or withdraw consent, download their personal data, ask for it to be corrected, or ask for their account to be deleted.

**Who uses it:** Shoppers; privacy officers; clients

**What it does**

- Give or withdraw consent to marketing and other uses; withdrawn marketing consent stops marketing from the next send.
- Download the personal data held about the customer.
- Request a correction of personal details used for orders and deliveries, with a due date set by the country's rules.
- Request deletion of the account; once approved, personal details are removed, while orders and invoices are kept under the record-keeping rules.
- Mark open privacy requests as overdue after the due date and notify the privacy officer.
- Show staff a full privacy history per customer: consents, downloads, corrections and deletions.
- Show no analytics and build no analytics profile for a visitor who has not accepted analytics cookies.

**Rules**

- Proposed, to be confirmed: corrections are approved or rejected by staff with a reason, and do not change addresses already on placed orders.
- Proposed, to be confirmed: a deletion is complete only when every part of the product holding that person's data has removed it.

**Benefit:** Meets data-protection law and builds trust.

### PRD-IAM-018 Account activity history

| Key facts |  |
|---|---|
| Phase | Phase 1 |
| Pack | Always included |
| For | Business buyers and shoppers |
| Availability | Planned for phase 1 |

Customers see a list of recent sign-ins, profile changes and payment attempts on their account, and when staff accessed their data.

**Who uses it:** Shoppers; authorised administrators

**What it does**

- List sign-ins and failed sign-ins, newest first, for a set look-back period.
- List changes to name, email, phone, password, second check and addresses, showing what changed but not the values.
- List payment attempts with time, method and status.
- Show when staff opened or changed the customer's data, with the staff name or role as the client chooses.
- Show the same history to authorised administrators.

**Rules**

- Proposed, to be confirmed: network addresses are partly hidden when shown to the customer.

**Benefit:** Customers can spot suspicious activity themselves.

### PRD-IAM-019 Account sync with Malawi Post systems

| Key facts |  |
|---|---|
| Phase | Phase 1 |
| Pack | Malawi Post-specific connection |
| For | Business buyers and shoppers |
| Availability | Planned for phase 1 |

Keeps customer accounts in step with Malawi Post's other internal systems through the Integration Layer.

**Who uses it:** Malawi Post; integration managers

**What it does**

- Send new, changed, deactivated and deleted customer accounts to the Integration Layer for the chosen details.
- Retry failed sends and list those that still fail for staff follow-up.
- Proposed, to be confirmed: accept changes from Malawi Post systems for chosen details, with the agreed system of record winning conflicts.
- Proposed, to be confirmed: tell the other systems when a customer is deleted.

**Benefit:** Avoids duplicate or conflicting customer records across Malawi Post systems.

### PRD-IAM-020 Identity checks by country

| Key facts |  |
|---|---|
| Phase | Phase 1 |
| Pack | Always included |
| For | Business buyers and shoppers |
| Availability | Planned for phase 1 |

A common connection that checks identity details, such as national ID, tax number or mobile-money registration, against official or mobile-network sources, with a separate connection for each country.

**Who uses it:** Compliance officers; clients; platform team

**What it does**

- Check an identity type and number where a process requires identity checks, and record the result as verified, not verified, inconclusive or unavailable.
- Check a person against their mobile-money registration.
- Check sellers for the seller onboarding process (PRD-SEL-004).
- Add a new country by adding its own connection, without changing the common part.
- Proposed, to be confirmed: send inconclusive or unavailable results to staff for manual review with a reason.

**Rules**

- Identity document images are not stored by this feature.
- Proposed, to be confirmed: suggestions from automated document reading are shown to the reviewer only; they never decide the result alone.

**Benefit:** Confirms buyers and sellers are who they say they are, and adds new countries without rebuilding.

### PRD-IAM-021 Customer order and document history

| Key facts |  |
|---|---|
| Phase | Phase 1 |
| Pack | Always included |
| For | Business buyers and shoppers |
| Availability | Planned for phase 1 |

Customers see all their past orders, invoices, quotes and returns, and can download or export them.

**Who uses it:** Shoppers; business buyers

**What it does**

- List past orders with number, date, status and total, and open details with items, totals and tracking numbers.
- Download a PDF invoice for an order.
- See quotes and return requests on their own pages, and download a quote as a PDF where the client allows it.
- Narrow the history by type, dates, status and value, and export it to a spreadsheet (CSV or Excel).
- Re-order a past order in one step, where the client allows it.

**Benefit:** Customers keep their own records and need less help from support.

### PRD-IAM-022 Company accounts for business buyers

| Key facts |  |
|---|---|
| Phase | Phase 1 |
| Pack | Business trade pack (optional) |
| For | Business buyers |
| Availability | Depends on a pending decision: confirmation by the client that this feature is needed in phase 1 (it was placed there by inference from the client documents) (ref PH-INF) |

A company account with several staff users who share addresses and order history, each with a role such as buyer, approver or company administrator.

**Who uses it:** Business buyers; company administrators

**What it does**

- Link orders placed by members to the company, visible to members with the right to view.
- Offer the company's shared addresses at checkout.
- Let a company administrator invite members by email and give each a company role: buyer, approver or company administrator.
- Send orders above a role's limit for approval within the company (approval limits are set in checkout, PRD-CHK-018).
- Proposed, to be confirmed: remove a member's access to company data while orders they placed stay with the company.

**Rules**

- Proposed, to be confirmed: people outside the company cannot open its orders.

**Benefit:** Lets organisations buy as a team with proper control.

### PRD-IAM-023 Trade account applications and approval

| Key facts |  |
|---|---|
| Phase | Phase 1 |
| Pack | Business trade pack (optional) |
| For | Business buyers |
| Availability | Depends on a pending decision: confirmation by the client that this feature is needed in phase 1 (it was placed there by inference from the client documents) (ref PH-INF) |

Businesses apply for a trade account by giving company details, VAT or tax number and documents; the client approves them before trade prices are shown.

**Who uses it:** Business buyers; client sales staff

**What it does**

- Apply with company name, registration number, tax or VAT number and the required documents.
- Approve an application, which gives the trade buyer role, creates a company account, shows trade prices and notifies the applicant.
- Proposed, to be confirmed: reject an application or ask for more information, with the reason sent to the applicant.

**Rules**

- Trade prices are not shown while an application is still waiting.
- Proposed, to be confirmed: uploaded documents must meet the platform's file type and size rules.

**Benefit:** Trade prices and terms go only to verified businesses.

### PRD-IAM-024 Tax-exempt and VAT-registered buyers

| Key facts |  |
|---|---|
| Phase | Phase 1 |
| Pack | Business trade pack (optional) |
| For | Business buyers |
| Availability | Planned for phase 1 |

Marks certain customers or groups as tax-exempt or VAT-registered and records their VAT number.

**Who uses it:** Business buyers; finance staff

**What it does**

- Mark a customer or a customer group as tax-exempt, so no tax is added to their orders.
- Apply an exemption approved on evidence from the next calculation, with the change recorded.
- Let a business buyer record a VAT number.
- Let staff mark a VAT number as valid or invalid.

**Rules**

- Settings for VAT numbers are checked for every country so that no buyer is exempted by mistake.

**Benefit:** Correct tax is charged on business sales.

### PRD-IAM-025 Customer home page

| Key facts |  |
|---|---|
| Phase | Phase 2 |
| Pack | Always included |
| For | Business buyers and shoppers |
| Availability | Planned for phase 2 |

A personal home page after sign-in showing open orders, quotes, things waiting for the customer and recent messages, a quick-action menu on every page, and the customer's own figures.

**Who uses it:** Shoppers; business buyers

**What it does**

- Show open orders, open quotes, items waiting for the customer (such as quotes to answer or deliveries to confirm) and the latest messages.
- Offer a quick-action menu on every page, such as place an order, raise a complaint or contact support.
- Show orders and spending per month for a chosen period.

**Benefit:** Customers see what needs their attention at a glance.

### PRD-IAM-026 Assisted service by outlet agents

| Key facts |  |
|---|---|
| Phase | Phase 1 |
| Pack | Assisted service pack (optional) |
| For | Business buyers and shoppers |
| Availability | Planned for phase 1 |

Named agents at outlets, such as post offices, register customers and place orders for them, with the agent and outlet recorded.

**Who uses it:** Outlet agents; walk-in customers; client administrators

**What it does**

- Let each agent sign in with their own named account.
- Register a walk-in customer with a mobile number or email, confirmed by a code the customer receives.
- Record the agent and outlet on the customer account and on the terms acceptance.
- Let the agent act for a customer and place orders, with the agent named on each order.
- Assign agents to outlets; the assignment limits what each agent can see.

**Rules**

- An agent account is never shared.
- A second sign-in check applies if the agent role requires it.
- Proposed, to be confirmed: agents act only for customers registered at their own outlets, and never for staff or administrators.
- Proposed, to be confirmed: an agent with no assigned outlet cannot register or act for customers.

**Benefit:** People without internet access or skills can still buy online through a helper.

### PRD-IAM-027 Company cost centres and budgets

| Key facts |  |
|---|---|
| Phase | Phase 2 |
| Pack | Business trade pack (optional) |
| For | Business buyers |
| Availability | Depends on a pending decision: confirmation by the client that this feature is needed in phase 1 (it was placed there by inference from the client documents) (ref PH-INF) |

Business customers set up cost centres and spending budgets for their staff users.

**Who uses it:** Business buyers; company administrators

**What it does**

- Set up cost centres with a budget for a period.
- Charge an order to a cost centre and add its total to the amount spent.
- Proposed, to be confirmed: refuse an order that would exceed the remaining budget, or send it for approval, as the client chooses.
- Proposed, to be confirmed: reduce the amount spent when a charged order is cancelled or refunded.

**Benefit:** Companies control spending by department.

<!-- pagebreak -->

## 7.3 Sellers and marketplace

This part of the product lets a client run a marketplace with many sellers, if it chooses to. It covers how businesses apply to sell, how they are checked and approved, the rules they must follow, and how they are rated, monitored and, where needed, blocked. It also covers commission, fees and how sellers are paid or invoiced.

### PRD-SEL-001 Seller application and profile

| Key facts |  |
|---|---|
| Phase | Phase 1 |
| Pack | Marketplace pack (optional) |
| For | Sellers and staff (back office) |
| Availability | Planned for phase 1 |

Businesses apply to sell on the platform and create a seller profile with name, description, logo and contact details. The marketplace can be switched on or off per client.

**Who uses it:** Applicants; sellers; client administrators

**What it does**

- Let a registered customer apply to sell with name, email, description, an optional logo and any details the client requires.
- Notify the client when an application is submitted.
- Ask guests to sign in or register before they apply.
- Show the applicant the status of the application and the next step (proposed, to be confirmed).
- Switch the marketplace on or off for a client.

**Rules**

- A new seller stays inactive until approved.
- An application missing a required detail is not accepted.
- Where a client has not confirmed it runs a marketplace, seller applications are switched off.

**Benefit:** Lets a client run a marketplace with many sellers if it wants to.

### PRD-SEL-002 Seller documents

| Key facts |  |
|---|---|
| Phase | Phase 1 |
| Pack | Marketplace pack (optional) |
| For | Sellers and staff (back office) |
| Availability | Planned for phase 1 |

Sellers upload required documents, such as registration certificates and licences; the platform stores them, tracks expiry dates and lets staff review them.

**Who uses it:** Applicants; sellers; compliance staff; client administrators

**What it does**

- List the documents each seller type and level requires, and let sellers upload them with issue and expiry dates.
- Capture identity and business registration details, such as registration number, with the application.
- Let compliance staff accept a document, ask for it again, or reject it; asking again and rejecting need a reason shown to the seller.
- Keep earlier versions when a seller uploads a replacement.
- Let administrators change the required details and documents per seller type and level without a new release.
- Alert the seller and compliance staff before a document expires, and mark it expired on the date.
- Proposed, to be confirmed: accept a valid document the seller already holds in their document store, without a new upload.

**Rules**

- If the client chooses, a seller's listings are paused when a required document expires.
- Proposed, to be confirmed: only the seller, its staff, compliance staff and administrators can open seller documents; other attempts are refused and logged.
- Proposed, to be confirmed: files must meet the platform's file type and size rules.

**Benefit:** Only properly documented businesses can sell.

### PRD-SEL-003 Seller approval stages and levels

| Key facts |  |
|---|---|
| Phase | Phase 1 |
| Pack | Marketplace pack (optional) |
| For | Sellers and staff (back office) |
| Availability | Depends on a pending decision: whether the workflow engine is built or an existing product is embedded (architecture decision) (ref WF-ENG) |

Seller applications move through clear stages (submitted, under review, approved, rejected, suspended), with verification levels and the ability to request an upgrade or appeal. Sellers see their current level, what it allows and what unlocks the next level.

**Who uses it:** Sellers; compliance staff; client administrators

**What it does**

- Move applications through submitted, under review, approved, rejected and suspended, recording the reviewer.
- Approve a seller, activating the seller account and notifying the seller.
- Reject an application with a reason shown and sent to the applicant.
- Suspend a seller with a reason, which pauses all its listings, and reinstate it later.
- Define verification levels, each with its own checks, documents and limits, without code.
- Show sellers their level, what it allows and what the next level needs, and let them request an upgrade or appeal a decision.
- Proposed, to be confirmed: share applications among reviewers by turn, or by seller type, level or country.

**Rules**

- A seller is approved only when every required document is accepted, the seller agreement is accepted and the block-list check passes.
- Proposed, to be confirmed: an approved seller can be taken off the marketplace only by suspension or blacklisting, not by switching it off or deleting it.
- Proposed, to be confirmed: an appeal is never decided by the reviewer who made the original decision.
- Proposed, to be confirmed: sellers already approved keep their level until checked again after a level changes.

**Benefit:** A fair, transparent and auditable onboarding process.

### PRD-SEL-004 Seller identity and registry checks

| Key facts |  |
|---|---|
| Phase | Phase 1 |
| Pack | Marketplace pack (optional) |
| For | Sellers and staff (back office) |
| Availability | Planned for phase 1 |

Uses the identity check connection (PRD-IAM-020) to check a seller's ID, tax number, business registration and mobile-money registration against official sources.

**Who uses it:** Compliance staff; sellers

**What it does**

- Check a seller's identity details where the seller's level requires it, and record the result.
- Check the name registered for a seller's mobile-money number against the seller or owner name, where the provider supports this.
- Fall back to document checks (PRD-SEL-002) where no mobile-money check is available.
- Proposed, to be confirmed: retry a check when the source is unavailable; a reviewer may decide by hand with a reason.

**Rules**

- Proposed, to be confirmed: a failed check blocks approval until a second authorised person records a reason to proceed, or the seller corrects the details and the check is run again.
- Proposed, to be confirmed: an inconclusive check blocks approval until an authorised reviewer records a decision with a reason and evidence.

**Benefit:** Reduces fraud by fake sellers.

### PRD-SEL-005 Seller payout accounts

| Key facts |  |
|---|---|
| Phase | Phase 1 |
| Pack | Marketplace pack (optional) |
| For | Sellers and staff (back office) |
| Availability | Depends on a pending decision: whether the workflow engine is built or an existing product is embedded (architecture decision) (ref WF-ENG) |

Sellers register the bank or mobile-money account where they will be paid; the account is checked, and any change needs a second person to approve it.

**Who uses it:** Sellers; finance staff

**What it does**

- Let an approved seller add one or more mobile-money or bank accounts.
- Hold the account number securely and show it partly hidden.
- Proposed, to be confirmed: check each account with the bank, against the mobile-money registered name, or by finance staff with evidence, before it is used.
- Proposed, to be confirmed: let a seller mark one checked account as the default for payouts.
- Send a change to account details for approval and tell the seller's owner by email and phone.
- Keep paying to the current details until a change is approved; a rejected change keeps the old details.

**Rules**

- The person who requested a change, or a seller's staff user, cannot approve it.
- Every approved or rejected change is recorded with old and new details.

**Benefit:** Stops payouts being diverted to fraudulent accounts.

### PRD-SEL-006 Seller agreement acceptance

| Key facts |  |
|---|---|
| Phase | Phase 1 |
| Pack | Marketplace pack (optional) |
| For | Sellers and staff (back office) |
| Availability | Planned for phase 1 |

Sellers must accept the seller agreement before they can start selling.

**Who uses it:** Clients; sellers

**What it does**

- Require applicants to tick acceptance of the published seller agreement when they apply.
- Record the acceptance with the person, seller, agreement version, channel and network address.
- Proposed, to be confirmed: ask approved sellers to accept a new version that requires it before they use the seller portal.

**Rules**

- An application without acceptance is refused.
- A seller cannot be activated until the current agreement is accepted.

**Benefit:** Gives a clear legal basis for the selling relationship.

### PRD-SEL-007 Marketplace rules and listing checks

| Key facts |  |
|---|---|
| Phase | Phase 1 |
| Pack | Marketplace pack (optional) |
| For | Sellers and staff (back office) |
| Availability | Planned for phase 1 |

Rules the client sets for what can be sold and by whom, checked before a listing goes live.

**Who uses it:** Clients; client administrators; sellers; compliance staff

**What it does**

- Publish marketplace rules for sellers, including prohibited items, listing standards and delivery service levels.
- Proposed, to be confirmed: set rules such as which seller types may sell in a category, the minimum number of pictures, and the listing limit per level, with each version kept.
- Check every listing against the rules before it is published, however it was added, and name each rule it breaks.
- Stop sellers adding products to categories closed to sellers, or beyond the maximum number of products.
- Proposed, to be confirmed: list published products that break a changed rule for compliance staff, without unpublishing them automatically.

**Benefit:** Keeps the marketplace within the client's policies.

### PRD-SEL-008 Seller home page and onboarding checklist

| Key facts |  |
|---|---|
| Phase | Phase 1 |
| Pack | Marketplace pack (optional) |
| For | Sellers and staff (back office) |
| Availability | Planned for phase 1 |

A seller home page with a step-by-step onboarding checklist, tasks to do, orders and payouts.

**Who uses it:** Sellers; applicants

**What it does**

- Show applicants a checklist: profile complete, agreement accepted, documents accepted, identity checks passed, payout account checked; each open item links to where it is done (proposed, to be confirmed).
- Show approved sellers the remaining checklist items, actions needed (such as expiring documents or an open appeal) and the next payout date and amount.
- Proposed, to be confirmed: collapse the checklist once every item is done.

**Benefit:** Sellers get started quickly and know what to do next.

### PRD-SEL-009 Seller staff accounts

| Key facts |  |
|---|---|
| Phase | Phase 1 |
| Pack | Marketplace pack (optional) |
| For | Sellers and staff (back office) |
| Availability | Planned for phase 1 |

Sellers add their own staff users with limited permissions.

**Who uses it:** Sellers; seller staff; client administrators

**What it does**

- Let the client define seller staff profiles, such as orders only or catalogue only.
- Let the seller owner invite a staff user by email with a chosen profile.
- Limit staff to the actions their profile allows and to the seller's own orders.
- Remove a staff user, who then loses seller access.

**Rules**

- Proposed, to be confirmed: staff cannot change payout accounts, staff or the agreement unless their profile allows it.
- Staff of a suspended seller cannot use the seller area.
- Adding and removing staff is recorded.

**Benefit:** Seller businesses can share the work safely.

### PRD-SEL-010 Seller types and sizes

| Key facts |  |
|---|---|
| Phase | Phase 2 |
| Pack | Marketplace pack (optional) |
| For | Sellers and staff (back office) |
| Availability | Planned for phase 2 |

Groups sellers into types or tiers, each with its own terms and processes.

**Who uses it:** Clients; client administrators; compliance staff

**What it does**

- Set up seller types, such as manufacturer, distributor or service provider, and seller sizes.
- Use the seller type to decide the verification level, required documents, commission rules, payout cycle and agreement version.
- Proposed, to be confirmed: apply a new type's rules from the time compliance staff change it, with the change recorded.

**Benefit:** Different seller groups can be treated appropriately without custom code.

### PRD-SEL-011 Seller performance monitoring

| Key facts |  |
|---|---|
| Phase | Phase 1 |
| Pack | Marketplace pack (optional) |
| For | Sellers and staff (back office) |
| Availability | Planned for phase 1 |

Tracks each seller's performance, such as on-time delivery, cancellations, returns and complaints, and triggers warnings or action when set limits are crossed.

**Who uses it:** Clients; client administrators; compliance staff; sellers

**What it does**

- Calculate each seller's orders fulfilled, cancellation rate, return rate, complaints and on-time delivery rate every day.
- Show these figures per seller and period to authorised staff, with export; each seller sees only its own.
- Send a warning and record an intervention when a seller crosses a set limit, including the delivery service level.
- Proposed, to be confirmed: pause a seller's listings when a limit set to "pause" is crossed, and tell compliance staff.
- Proposed, to be confirmed: propose a suspension to compliance staff when a limit set to "suspend" is crossed.

**Rules**

- Proposed, to be confirmed: a seller is suspended only when compliance staff confirm.

**Benefit:** Keeps marketplace quality high for buyers.

### PRD-SEL-012 Seller ratings

| Key facts |  |
|---|---|
| Phase | Phase 1 |
| Pack | Marketplace pack (optional) |
| For | Sellers and staff (back office) |
| Availability | Planned for phase 1 |

Buyers rate sellers after an order; ratings are moderated.

**Who uses it:** Shoppers; sellers; client administrators

**What it does**

- Let the buyer rate the seller with a score and comment once the order is complete.
- Hold ratings for approval before they show, if the client chooses.
- Let sellers and users report an abusive rating, and hide it if a moderator agrees.
- Show the average score and number of ratings on the seller's page.

**Rules**

- One rating per order and seller, by the buyer of a completed order only.

**Benefit:** Helps buyers choose reliable sellers and motivates good service.

### PRD-SEL-013 Block and watch lists

| Key facts |  |
|---|---|
| Phase | Phase 1 |
| Pack | Always included |
| For | Staff (back office) |
| Availability | Planned for phase 1 |

Lists of blocked, watched and allowed users, sellers, internet addresses and devices, with reasons, time limits and history; sign-ups, sign-ins, checkouts and seller applications are checked against them.

**Who uses it:** Security and fraud staff

**What it does**

- Add entries for a customer, seller, email, phone, internet address or device, as block, watch or allow, with a reason, start and optional end date.
- Apply an entry to registration, sign-in, checkout, seller applications or all of these.
- End an entry automatically on its end date.
- Stop a blocked person registering, applying to sell or checking out, without telling them the reason.
- Let a watched person continue and raise a flag for review.
- Proposed, to be confirmed: stop a blocked person signing in, by password or by a code sent to their mobile phone, and refuse every shop page for a blocked internet address where the entry covers all actions.

**Rules**

- Every new entry, change and removal is recorded with old and new values.
- Proposed, to be confirmed: an allow entry stops a watch flag being raised.

**Benefit:** Stops known fraudsters and abusers.

### PRD-SEL-014 Approved supplier panels

| Key facts |  |
|---|---|
| Phase | Phase 2 |
| Pack | Business trade pack (optional) |
| For | Business buyers |
| Availability | Planned for phase 2 |

The client approves a set of suppliers for each category; only they are invited to quote for requests in that category. Each approval has a validity period, and suppliers are asked to renew before it expires.

**Who uses it:** Procurement staff; suppliers

**What it does**

- Add an approved seller to a category's supplier panel with an end date.
- Invite only current panel members of a category to quote for requests in that category.
- Tell a supplier when renewal is due.
- End panel membership on the end date if it is not renewed.

**Benefit:** Requests for quotation go only to vetted suppliers.

### PRD-SEL-015 Bulk import and invitation of customers and sellers

| Key facts |  |
|---|---|
| Phase | Phase 2 |
| Pack | Marketplace pack (optional) |
| For | Sellers and staff (back office) |
| Availability | Planned for phase 2 |

Staff upload a spreadsheet of customers or sellers and invite them with their details already filled in. Every row is checked, duplicates are found, and a result is shown for every row.

**Who uses it:** Client staff

**What it does**

- Upload a file in the published template; every value in each row is checked.
- Create an invitation with the given details for each valid row.
- Send invitations by email or SMS; the person completes the profile and sets a password, and sellers go on to the seller application.
- Mark rows that match an existing customer or another row as duplicates.
- Show and download the result of every row: created, duplicate or error, with the reason.
- Proposed, to be confirmed: expire unaccepted invitations after a set time and let staff send them again.

**Benefit:** Brings many participants on board quickly.

### PRD-SEL-016 Commission and fee rules

| Key facts |  |
|---|---|
| Phase | Phase 1 |
| Pack | Marketplace pack (optional) |
| For | Sellers and staff (back office) |
| Availability | Planned for phase 1 |

The client sets commission and fee rates by category, service or listing type, seller type and delivery service, with dates from which they apply.

**Who uses it:** Clients; finance staff

**What it does**

- Set commission as a percentage or a fixed fee by category, service or listing type, seller type or delivery service.
- Record commission and fees on each paid order line with the rule version used.
- Schedule a rate change from a future date; orders keep the rate in force when they were placed.
- Change rules without a new release, with every change recorded.
- Proposed, to be confirmed: charge fees such as a listing fee and deduct them in the next settlement.

**Rules**

- Proposed, to be confirmed: the most specific rule wins, in the order seller, seller type or level, listing or service type, category, then default.
- Proposed, to be confirmed: where no rule and no default apply, the line is flagged for finance staff and no commission is assumed.
- Builds on an add-on bought from an outside supplier; a version for the current product base must still be confirmed by that supplier.

**Benefit:** The marketplace earns revenue correctly and fees change without code changes.

### PRD-SEL-017 Seller settlements and payouts

| Key facts |  |
|---|---|
| Phase | Phase 1 |
| Pack | Marketplace pack (optional) |
| For | Sellers and staff (back office) |
| Availability | Depends on a pending decision: whether the workflow engine is built or an existing product is embedded (architecture decision) (ref WF-ENG); the payment model for paying sellers directly, and whether a payment-service or e-money licence is needed (Product Owner and legal advice) (ref PAY-DIRECT) |

Calculates what each seller is owed, produces settlement statements and pays sellers on a regular cycle.

**Who uses it:** Sellers; finance staff

**What it does**

- Calculate each seller's settlement: their share, less refunds, fees, penalties, loan repayment deductions and other seller charges, plus adjustments.
- Run settlements on each seller's own cycle, such as daily or weekly.
- Let authorised finance staff release a payout to the seller's checked default account.
- Record the payout as paid or failed, and retry a failed payout.
- Let sellers view and download a monthly statement (PDF and CSV) showing, per order line, what was earned, deducted and paid.
- Proposed, to be confirmed: carry a zero or negative balance forward to the next settlement.

**Rules**

- Each amount is included in exactly one settlement.
- A seller cannot see another seller's statement.
- Proposed, to be confirmed: no payout is released without a checked payout account.
- Proposed, to be confirmed: service lines are paid only once the service is accepted.

**Benefit:** Sellers are paid correctly and on time.

### PRD-SEL-018 Seller locations and delivery by the client

| Key facts |  |
|---|---|
| Phase | Phase 1 |
| Pack | Marketplace pack (optional) |
| For | Sellers and staff (back office) |
| Availability | Planned for phase 1 |

Sellers record their business locations, choose pickup or drop-off options, and can choose to let the client handle delivery for them.

**Who uses it:** Sellers; logistics staff

**What it does**

- Add business locations, pickup points and drop-off points with a pickup or drop-off preference.
- Use the location as the starting point for collection, or for drop-off at an outlet.
- Let sellers opt in to the client's delivery services where the client offers them in that area.
- Proposed, to be confirmed: stop a seller closing a location still used by open shipments.

**Benefit:** Delivery can be organised from the right place.

### PRD-SEL-019 Seller holiday mode

| Key facts |  |
|---|---|
| Phase | Phase 1 |
| Pack | Marketplace pack (optional) |
| For | Sellers and staff (back office) |
| Availability | Planned for phase 1 |

Sellers can temporarily pause their listings with a message, for example during holidays.

**Who uses it:** Sellers; shoppers

**What it does**

- Schedule a pause with start, end and a message in each language.
- Pause all listings at the start time while seller staff keep access to the seller area.
- Show the seller's message and return date on the seller page and on paused product pages.
- Stop paused items in a shopper's basket from being checked out.
- End the pause at the end time or earlier at the seller's choice.

**Rules**

- Listings resume only when no other pause reason remains.

**Benefit:** Avoids orders the seller cannot fulfil.

### PRD-SEL-020 Seller notifications

| Key facts |  |
|---|---|
| Phase | Phase 1 |
| Pack | Marketplace pack (optional) |
| For | Sellers and staff (back office) |
| Availability | Planned for phase 1 |

Sellers receive notifications about verification, new and changed orders and complaints on the channels the client has set up.

**Who uses it:** Sellers

**What it does**

- Notify sellers by email of orders placed, paid and cancelled, and of low stock, plus SMS or app where set up, in the seller's language.
- Notify sellers of approval decisions, document requests and expiry, and payout account decisions, with the action needed and a link.
- Notify sellers of a complaint with the reference and the date a response is due.
- Respect the seller's contact preferences and opt-outs.
- Proposed, to be confirmed: use a fallback channel when one fails, and log the failure.

**Benefit:** Sellers react quickly.

### PRD-SEL-021 Seller onboarding progress report

| Key facts |  |
|---|---|
| Phase | Phase 1 |
| Pack | Marketplace pack (optional) |
| For | Sellers and staff (back office) |
| Availability | Planned for phase 1 |

A report showing how many sellers registered, submitted, were approved or rejected, and how long each step took.

**Who uses it:** Client management

**What it does**

- Count sellers registered, submitted, approved and rejected for a period.
- Show the typical and longest time from submission to decision and between each step.
- Narrow the report by seller type and level, and export it.

**Rules**

- Proposed, to be confirmed: "registered" counts people who started a seller sign-up, and "submitted" counts applications made.

**Benefit:** Shows where seller onboarding gets stuck.

### PRD-SEL-022 Seller diversity tracking

| Key facts |  |
|---|---|
| Phase | Phase 3 |
| Pack | Marketplace pack (optional) |
| For | Sellers and staff (back office) |
| Availability | Planned for phase 3 |

Records seller characteristics such as women-owned or youth-owned business and reports their share.

**Who uses it:** Clients; compliance staff; programme funders

**What it does**

- Let sellers declare characteristics, such as women-owned or youth-owned, at application or in their profile.
- Show these to compliance staff.
- Report the share of approved sellers, active listings and sales value for each characteristic.

**Benefit:** Supports inclusion targets in development programmes.

### PRD-SEL-023 Seller training content

| Key facts |  |
|---|---|
| Phase | Phase 1 |
| Pack | Marketplace pack (optional) |
| For | Sellers and staff (back office) |
| Availability | Planned for phase 1 |

Help pages, templates and guides for sellers.

**Who uses it:** Sellers; applicants; client administrators

**What it does**

- Publish training pages and downloadable templates that only sellers can open.
- Show links to onboarding content next to the applicant's checklist.
- Send changes to content for approval where the client uses content approval.

**Benefit:** Sellers learn to use the platform without one-to-one training.

### PRD-SEL-024 Seller blacklisting

| Key facts |  |
|---|---|
| Phase | Phase 1 |
| Pack | Marketplace pack (optional) |
| For | Sellers and staff (back office) |
| Availability | Planned for phase 1 |

A blocked list and watch list for sellers and suppliers with a history of fraud or abuse. Each entry has a period and an appeal route, and applies automatically.

**Who uses it:** Clients; compliance staff; sellers; shoppers

**What it does**

- Blacklist a seller with a reason and period, which suspends the seller and pauses its listings.
- Block the seller's linked details too: owner and staff email and phone, registration number and payout accounts.
- Refuse new seller applications that use any of those details.
- Put a seller on a watch list so that its listings and orders are flagged for review.
- Let a blacklisted seller appeal from its account page; a different reviewer decides, and the seller is told the outcome.

**Rules**

- Proposed, to be confirmed: when a blacklist period ends, the seller stays suspended until compliance staff reinstate it.

**Benefit:** Keeps bad sellers off the marketplace.

### PRD-SEL-025 Commission invoices to sellers

| Key facts |  |
|---|---|
| Phase | Phase 2 |
| Pack | Marketplace pack (optional) |
| For | Sellers and staff (back office) |
| Availability | Depends on a pending decision: confirmation by the client that this feature is needed in phase 1 (it was placed there by inference from the client documents) (ref PH-INF); acceptance by the Product Owner of features recommended without a client source (ref PO-REC-v8); the payment model for paying sellers directly, and whether a payment-service or e-money licence is needed (Product Owner and legal advice) (ref PAY-DIRECT); whether statutory electronic invoicing (KRA eTIMS in Kenya, MRA EIS in Malawi) is required (both clients to confirm) (ref E-INV); whether a licensed add-on is bought or the capability is built (technical and Product Owner decision) (ref PAID-STUB); which document and QR-code generation product is used (technical decision) (ref DOC-LIB) |

When buyers pay sellers directly, the client cannot deduct commission and fees from the payment, so the platform invoices each seller regularly for them, tracks payment, and can restrict sellers with overdue amounts.

**Who uses it:** Clients; finance staff; sellers

**What it does**

- Record the commission due on each directly paid order line, using the rules in force when the order was placed.
- Issue a commission invoice per period with lines per order, commission, fees and tax, and let the seller download it.
- Record the invoice as an amount owed by the seller, with statements and payment tracking.
- Submit the invoice as a fiscal invoice where electronic invoicing applies.
- Mark unpaid invoices overdue after the due date and grace days, notify the seller and, if the client chooses, pause the seller's listings until paid.
- Proposed, to be confirmed: reduce the commission due when a line is refunded before invoicing.

**Benefit:** The client still earns its commission under the direct-payment model.

<!-- pagebreak -->

## 7.4 Product catalogue

This part of the product holds everything the shop sells: products, services, categories, prices and product information. Catalogue staff and sellers create and maintain listings, which are checked against the client's quality and policy rules and approved before they go live. Shoppers and business buyers browse, compare and review products, and see clear prices, delivery promises and returns information.

### PRD-CAT-001 Category tree

| Key facts |  |
|---|---|
| Phase | Phase 1 |
| Pack | Always included |
| For | Business buyers and shoppers |
| Availability | Planned for phase 1 |

The tree of product categories, for example Tea > Black tea > Bulk, with names in each language, web addresses, pictures, display order and limits on who can see them.

**Who uses it:** Shoppers; catalogue staff; client administrators

**What it does**

- Create categories under a parent category, with names in each language, web addresses, pictures and display order.
- Let shoppers browse categories and subcategories, with their products in display order.
- Show the main-language name where a translation is missing.
- Limit a category to certain customer groups or shops.
- Hide unpublished categories from shoppers.

**Rules**

- Each category gets a unique web address.
- Only staff with catalogue rights can create or change categories; sellers cannot.

**Benefit:** Customers find products easily, and the shop stays organised.

### PRD-CAT-002 Product record

| Key facts |  |
|---|---|
| Phase | Phase 1 |
| Pack | Always included |
| For | Business buyers and shoppers |
| Availability | Planned for phase 1 |

The main product record: name, short and full description, product code (SKU), barcode, price, weight, size, pictures and whether it is published. Staff and sellers can edit it, with required information and upload limits.

**Who uses it:** Catalogue staff; sellers; client administrators; shoppers

**What it does**

- Create and edit products with name, descriptions, product code, barcode, price, weight, dimensions and pictures; new products start as drafts.
- Let sellers create and manage only their own products.
- Record weight and dimensions for delivery pricing and planning.
- Hide parts of the product form that a client does not use.
- Let the client set which file types and sizes can be uploaded as product pictures and documents.

**Rules**

- A listing cannot be submitted or published without a name, full description, price (unless "call for price"), stock quantity where stock is managed, and at least one picture.
- Sellers cannot exceed the client's limit on number of products or pictures.
- Uploads of the wrong type or size are refused.

**Benefit:** Every product has complete, consistent information.

### PRD-CAT-003 Automatic product codes

| Key facts |  |
|---|---|
| Phase | Phase 1 |
| Pack | Always included |
| For | Business buyers and shoppers |
| Availability | Planned for phase 1 |

Product codes are created automatically from a pattern the client sets, for example KTDA-2026-00045, unique within each shop.

**Who uses it:** Catalogue staff

**What it does**

- Create a product code from the client's pattern whenever a product is added without one, however it is added.
- Take the next number in the sequence if a generated code already exists.
- Proposed, to be confirmed: patterns made of a fixed prefix, the year and a sequence number with a set number of digits.

**Rules**

- A typed code that already exists is refused.
- Proposed, to be confirmed: two products added at the same moment always get different codes, and numbers of deleted products are not reused.
- Proposed, to be confirmed: changing the pattern does not change existing codes, and the change is recorded.

**Benefit:** No duplicate or inconsistent codes, without typing them by hand.

### PRD-CAT-004 Product options and descriptive details

| Key facts |  |
|---|---|
| Phase | Phase 1 |
| Pack | Always included |
| For | Business buyers and shoppers |
| Availability | Planned for phase 1 |

Product options, such as pack size, and descriptive details, such as grade, origin or "fragile", which can be translated and used to narrow search results.

**Who uses it:** Shoppers; catalogue staff; sellers

**What it does**

- Add descriptive details, such as size or grade, that shoppers can use to narrow category and search results.
- Add options, such as pack size, that change the price and weight when chosen.
- Show option and detail names in the shopper's language.
- Proposed, to be confirmed: let sellers record "fragile" and handling notes, shown on the product page and passed to delivery documents.

**Benefit:** Customers can compare and narrow down products by what matters to them.

### PRD-CAT-005 Required details per category and listing quality checks

| Key facts |  |
|---|---|
| Phase | Phase 1 |
| Pack | Always included |
| For | Business buyers and shoppers |
| Availability | Planned for phase 1 |

For each category, the client decides which details must be filled in before a product can be published, and the platform checks this.

**Who uses it:** Client administrators; catalogue staff; sellers

**What it does**

- Set, per category, which details are required before publishing.
- Let sellers run a quality check that lists every missing detail before they submit.
- Warn sellers when a picture is smaller than the set minimum size, while still allowing submission.
- Record who changed the required details, when, and what changed.
- Proposed, to be confirmed: send changes to required details for approval by a different person before they take effect.
- Proposed, to be confirmed: list published products that miss a newly required detail for their owners, without unpublishing them.

**Rules**

- A listing missing a required detail cannot be submitted or published.
- Proposed, to be confirmed: a subcategory follows its parent's requirements, and a product in two categories must meet both.

**Benefit:** Product information is complete and consistent.

### PRD-CAT-006 Product versions (variants)

| Key facts |  |
|---|---|
| Phase | Phase 1 |
| Pack | Always included |
| For | Business buyers and shoppers |
| Availability | Planned for phase 1 |

One product can have versions, for example 250 g, 500 g and 1 kg, each with its own code, price, stock and picture.

**Who uses it:** Shoppers; catalogue staff

**What it does**

- Create all versions of a product in one step from its options.
- Give each version its own code, barcode, price, stock and picture.
- Show the chosen version's code, price, stock and picture on the product page.
- Warn the shopper and not add a version that is out of stock, unless back-orders are allowed.

**Rules**

- Proposed, to be confirmed: a version code that duplicates another code is refused.

**Benefit:** Customers choose the exact version they want.

### PRD-CAT-007 Bundles and kits

| Key facts |  |
|---|---|
| Phase | Phase 1 |
| Pack | Engagement and loyalty pack (optional) |
| For | Business buyers and shoppers |
| Availability | Planned for phase 1 |

Several products sold together as one bundle or kit with a bundle price.

**Who uses it:** Sellers; shoppers; marketing staff

**What it does**

- Create a bundle from several products with quantities and one bundle price.
- Show the bundle's contents with names, quantities and pictures on its page.
- Reduce the stock of each item in the bundle when it is sold.
- Refuse to add a bundle to the basket when any item in it is unavailable.

**Rules**

- Proposed, to be confirmed: a seller can bundle only their own products.

**Benefit:** Supports gift packs and combined offers.

### PRD-CAT-008 Copying products and listing templates

| Key facts |  |
|---|---|
| Phase | Phase 2 |
| Pack | Always included |
| For | Business buyers and shoppers |
| Availability | Planned for phase 2 |

Copy an existing product to create a new one with the same settings and pictures. Frequently used set-ups can be saved as named listing templates.

**Who uses it:** Catalogue staff; sellers

**What it does**

- Copy a product with its settings and pictures; the copy starts as an unpublished draft.
- Save a product's set-up as a named template, visible only to that seller, or to all staff for a staff template.
- Start a new draft listing from a template, with a new product code.
- Proposed, to be confirmed: a template holds descriptions, category, options, tax category, dimensions and delivery settings, but not code, stock or pictures.

**Rules**

- A seller cannot copy another seller's product.

**Benefit:** Speeds up adding similar products.

### PRD-CAT-009 Bulk upload, export and PDF catalogue

| Key facts |  |
|---|---|
| Phase | Phase 1 |
| Pack | Always included |
| For | Business buyers and shoppers |
| Availability | Planned for phase 1 |

Add or update many products at once from Excel, CSV or XML files, export the catalogue and print a PDF catalogue. Sellers can upload too, within limits. Columns are matched by name automatically.

**Who uses it:** Catalogue staff; sellers

**What it does**

- Upload Excel, CSV or XML files in the standard template; new products start as drafts and existing ones are updated by product code.
- Let sellers upload their own products where the client allows it.
- Export all or selected products to Excel or XML.
- Produce a PDF catalogue for offline use and tenders.
- Process very large Excel files in parts, if the client chooses.

**Rules**

- Sellers can upload only their own products and within their product limit.
- Proposed, to be confirmed: a file never publishes a product; changes to published products follow the same re-approval as form changes.
- Proposed, to be confirmed: files in other formats are refused.

**Benefit:** Saves hours of manual typing.

### PRD-CAT-010 Bulk upload check report

| Key facts |  |
|---|---|
| Phase | Phase 1 |
| Pack | Always included |
| For | Business buyers and shoppers |
| Availability | Planned for phase 1 |

Before a bulk upload is saved, the platform checks every row and lists any errors to fix. Very large files trigger a warning before the upload starts.

**Who uses it:** Catalogue staff; sellers

**What it does**

- Check every row for required columns, correct values, existing categories and brands, unique codes, required details and prohibited words.
- List each error with row number, column and message, for download.
- Ask for confirmation before checking a very large file, with the option to cancel.
- Record the result of each upload: created, updated and unchanged counts.

**Rules**

- Proposed, to be confirmed: nothing is uploaded while the report shows any error.

**Benefit:** Prevents bad data from going live.

### PRD-CAT-011 Catalogue connection for other systems

| Key facts |  |
|---|---|
| Phase | Phase 1 |
| Pack | Commerce extensions pack (optional) |
| For | Business buyers and shoppers |
| Availability | Depends on a pending decision: which connection product is used for other systems to read and update the catalogue (technical decision) (ref API-01); whether a licensed add-on is bought or the capability is built (technical and Product Owner decision) (ref PAID-STUB); which integration gateway product is used and who runs secure sign-in for partners (technical decision) (ref API-GW) |

A secure connection that lets other systems, such as an ERP, create, update and read product information automatically.

**Who uses it:** IT teams; partners

**What it does**

- Let an approved partner system read products changed since a date, with prices, stock availability, categories and options, for its permitted shop.
- Let an approved ERP create and update products, with the same checks as the staff form.
- Refuse and log requests from systems without valid permission.
- Limit how many requests each partner system can make in a period, without affecting others.
- Keep each published version of the connection working for a notice period before it is retired.

**Rules**

- Products created this way start as drafts and are never published by the connection.
- Unpublished products are shared only with systems specifically allowed to see them.

**Benefit:** Keeps the shop in step with the client's other systems without retyping.

### PRD-CAT-012 Prices by customer group and quantity

| Key facts |  |
|---|---|
| Phase | Phase 1 |
| Pack | Always included |
| For | Business buyers and shoppers |
| Availability | Planned for phase 1 |

Different prices for different customer groups and quantities, for example a lower price when buying 100 units, with start and end dates.

**Who uses it:** Business buyers; sales staff; sellers

**What it does**

- Set prices per customer group and quantity, with start and end dates and, if needed, per shop.
- Show the quantity prices on the product page and apply the right price in the basket.
- Let sellers change the base price and add dated prices for their own products; changes are kept in the version history.

**Rules**

- A price outside its dates, or for another shop, is not used.
- A seller cannot change another seller's prices.

**Benefit:** Supports retail, dealer, bulk and institutional pricing.

### PRD-CAT-013 Call for price (request a quote)

| Key facts |  |
|---|---|
| Phase | Phase 1 |
| Pack | Business trade pack (optional) |
| For | Business buyers |
| Availability | Planned for phase 1 |

Hides the price on chosen products and shows a "request a quote" button instead of "add to basket".

**Who uses it:** Business buyers; sales staff

**What it does**

- Hide the price and the "add to basket" button on chosen products and show "request a quote".
- Let a buyer send quantity, options and notes from the product page to start a quote request.
- Use the quoted price once the buyer accepts the quote and moves it to the basket.
- Proposed, to be confirmed: ask guests to sign in before requesting a quote.

**Rules**

- The quote button shows only on "call for price" products; the basket-level quote request is unchanged.

**Benefit:** Bulk and negotiated items are sold by quote instead of a fixed price.

### PRD-CAT-014 Product tax category

| Key facts |  |
|---|---|
| Phase | Phase 1 |
| Pack | Always included |
| For | Business buyers and shoppers |
| Availability | Planned for phase 1 |

Assigns each product a tax category, or marks it exempt, so the right tax is calculated.

**Who uses it:** Finance staff; catalogue staff

**What it does**

- Pre-select the client's default tax category for new products.
- Apply the rate set for the product's tax category on every sale.
- Mark a product as tax-exempt so no tax is charged on it.

**Benefit:** Correct tax on every sale.

### PRD-CAT-015 Export and customs details

| Key facts |  |
|---|---|
| Phase | Phase 1 |
| Pack | Business trade pack (optional) |
| For | Business buyers |
| Availability | Planned for phase 1 |

Extra product details needed for export: customs (HS) code, country of origin and duty information.

**Who uses it:** Export staff; sellers; international buyers

**What it does**

- Record an HS code, country of origin and duty note on each product, where the shop uses them.
- Print these details on export documents for each order line.
- Proposed, to be confirmed: refuse an HS code in the wrong format, and accept only countries from the country list.
- Proposed, to be confirmed: require these details before a product offered for international delivery can be submitted.

**Benefit:** Supports international shipping and customs paperwork.

### PRD-CAT-016 Product pictures and media

| Key facts |  |
|---|---|
| Phase | Phase 1 |
| Pack | Always included |
| For | Business buyers and shoppers |
| Availability | Planned for phase 1 |

Several pictures per product, videos, 360-degree views, PDF brochures and zoom, with configurable image sizes and quality.

**Who uses it:** Shoppers; client administrators

**What it does**

- Show several pictures with thumbnails and an embedded video on the product page.
- Let shoppers zoom into a full-size picture.
- Show a 3D model of the product that shoppers can turn, zoom and let rotate (ready-made); a separate 360-degree photo view only if the client does not accept the 3D model for this.
- Offer a PDF brochure for download.
- Resize pictures above the set maximum size.

**Rules**

- Files of the wrong type or size are refused.
- Sellers can add 3D models to their own products only if the client allows it.

**Benefit:** Customers can see what they are buying.

### PRD-CAT-017 Product content in each language

| Key facts |  |
|---|---|
| Phase | Phase 1 |
| Pack | Always included |
| For | Business buyers and shoppers |
| Availability | Planned for phase 1 |

Product names, descriptions and details written in each language the shop offers.

**Who uses it:** Shoppers; catalogue staff

**What it does**

- Enter name, short and full description and search-engine text in each language, for example the six languages KTDA requires.
- Show the shopper's language, or the main language where a translation is missing.
- Pre-translate empty text by machine and mark the listing for review before publication.
- Offer a generated product description for staff to edit; it is saved only when staff save the product.

**Benefit:** Customers read product information in their own language.

### PRD-CAT-018 Product questions and answers

| Key facts |  |
|---|---|
| Phase | Phase 2 |
| Pack | Marketplace pack (optional) |
| For | Sellers and staff (back office) |
| Availability | Planned for phase 2 |

Shoppers ask questions on a product page; the seller or staff answer; questions and answers are published after moderation.

**Who uses it:** Shoppers; sellers; catalogue staff

**What it does**

- Let registered shoppers ask a question on a product page.
- Let sellers answer questions about their products.
- Let staff approve or reject questions and answers; approved ones show to all shoppers, and authors of rejected ones are told.
- Proposed, to be confirmed: tell the person who asked when an answer is published.

**Rules**

- Nothing is published before moderation, and every decision is recorded.
- Proposed, to be confirmed: guests must sign in to ask.

**Benefit:** Answers common questions once for everyone and builds confidence to buy.

### PRD-CAT-019 Regulated products and certificates

| Key facts |  |
|---|---|
| Phase | Phase 2 |
| Pack | Always included |
| For | Business buyers and shoppers |
| Availability | Planned for phase 2 |

For regulated products, required legal details and certificates with validity dates are stored; the platform warns before a certificate expires and can hide the product when it does. Each product shows its compliance review status.

**Who uses it:** Compliance staff; sellers

**What it does**

- Mark categories as regulated with the legal details they require.
- Store certificates with type, number, issuer, validity dates and the file.
- Warn the seller and compliance staff once before a certificate expires.
- Pause and hide a listing when its certificate expires, where the category is set to do so.
- Set a review status on each regulated listing: pending, validated, flagged, escalated or barred.

**Rules**

- A regulated listing cannot be submitted without its legal details and a valid certificate.
- A barred listing cannot be submitted or published.

**Benefit:** Avoids selling products without valid certification.

### PRD-CAT-020 Origin and product story

| Key facts |  |
|---|---|
| Phase | Phase 1 |
| Pack | Commerce extensions pack (optional) |
| For | Business buyers and shoppers |
| Availability | Planned for phase 1 |

Shows where a product comes from, for example the factory, farm or region, using producer pages, product details and content pages. Certificates and ownership-chain documents can be attached as proof of origin.

**Who uses it:** Shoppers; marketing staff

**What it does**

- Link a product to its producer page with description, picture and other products.
- Link a factory or farmer story page from the producer page.
- Attach proof-of-origin documents for shoppers to download; documents marked internal are not shown.

**Rules**

- Attached documents must meet the file type and size rules.

**Benefit:** Buyers value knowing the origin and story of the product.

### PRD-CAT-021 Listing policy checks and reports

| Key facts |  |
|---|---|
| Phase | Phase 1 |
| Pack | Marketplace pack (optional) |
| For | Sellers and staff (back office) |
| Availability | Planned for phase 1 |

Blocks prohibited items and words, lets shoppers report a listing, and handles takedown requests with evidence.

**Who uses it:** Clients; client administrators; shoppers; compliance staff

**What it does**

- Refuse listings, by any route, whose text in any language contains a prohibited word.
- Refuse listings placed in a prohibited category.
- Let shoppers report a listing from the product page or search results, and notify compliance staff.
- Record takedown requests with requester, basis and evidence.
- Withdraw a listing when a report or takedown is upheld, notify the seller and keep the evidence.
- Proposed, to be confirmed: send listings matching a "flag" rule to review with the reason shown.

**Rules**

- An upheld decision needs a reason and is recorded.
- Proposed, to be confirmed: a dismissed report leaves the listing unchanged and the reporter is told.

**Benefit:** Keeps illegal or harmful items off the shop.

### PRD-CAT-022 Listing stages and approval

| Key facts |  |
|---|---|
| Phase | Phase 1 |
| Pack | Always included |
| For | Sellers and staff (back office) |
| Availability | Depends on a pending decision: whether the workflow engine is built or an existing product is embedded (architecture decision) (ref WF-ENG) |

Products move through stages (draft, in review, approved, published, paused, archived), with approval by one or more approvers in sequence, for example catalogue staff then a manager, before publishing.

**Who uses it:** Catalogue staff; approvers; client administrators

**What it does**

- Move a listing from draft to review once its checks pass.
- Approve in one or more steps in sequence; the listing is approved after the last step.
- Reject or ask for changes with a reason, and tell the owner.
- Send listings to review queues by category, seller, seller level and shop, with a default queue.
- Pause, resume and archive published listings, with every change recorded.
- Pause all of a seller's listings when the seller may not sell (for example suspended or on holiday) and resume them only when no reason remains (proposed, to be confirmed).

**Rules**

- A listing is shown to shoppers only in the published stage; no route can publish it otherwise.
- A reason is required to reject or ask for changes.
- Proposed, to be confirmed: a person cannot approve a listing they submitted.
- Proposed, to be confirmed: editing a listing under review sends it back to draft.

**Benefit:** Only checked products go live.

### PRD-CAT-023 Listing version history and autosave

| Key facts |  |
|---|---|
| Phase | Phase 1 |
| Pack | Always included |
| For | Business buyers and shoppers |
| Availability | Planned for phase 1 |

Keeps every saved version of a product so changes can be compared or undone, and saves drafts automatically.

**Who uses it:** Catalogue staff; sellers

**What it does**

- Keep a version each time a product is saved, with who, when and how it was saved.
- Compare two versions, showing old and new values.
- Restore an earlier version as a new version, following the normal approval rules.
- Offer to restore or discard an unsaved draft when the user reopens the product.
- Proposed, to be confirmed: save unsaved edits automatically at set intervals without changing the live product.

**Rules**

- Proposed, to be confirmed: a save is refused if someone else saved the product after it was opened.

**Benefit:** No work is lost, and mistakes can be reversed.

### PRD-CAT-024 Listing availability and withdrawal

| Key facts |  |
|---|---|
| Phase | Phase 1 |
| Pack | Always included |
| For | Business buyers and shoppers |
| Availability | Planned for phase 1 |

Show or hide a product, set when it is available, allow pre-orders, and withdraw it with a reason. Customers watching the product are told, and linked items such as held stock, payments held in escrow and open disputes are passed to the right staff.

**Who uses it:** Catalogue staff; shoppers

**What it does**

- Set the dates between which a product can be bought.
- Allow pre-orders with a start date shown to shoppers.
- Withdraw a product with a reason; it is hidden and the withdrawal is recorded.
- Stop a withdrawn product in a basket from being checked out.
- Release basket stock holds and list escrow orders and open cases for staff after a withdrawal.
- Proposed, to be confirmed: tell shoppers who are watching the product or have it in a wish list.

**Rules**

- A withdrawal needs a reason.
- Withdrawal does not change orders or payments itself.

**Benefit:** Control over what customers can buy and when.

### PRD-CAT-025 Out-of-date listing alerts

| Key facts |  |
|---|---|
| Phase | Phase 2 |
| Pack | Marketplace pack (optional) |
| For | Sellers and staff (back office) |
| Availability | Planned for phase 2 |

Flags products not updated for a set number of days, reminds the seller and can pause them automatically.

**Who uses it:** Clients; client administrators; sellers; shoppers

**What it does**

- Set the number of days per category after which a listing counts as out of date.
- Flag out-of-date listings daily and remind the seller once.
- Clear the flag when the seller confirms or edits the listing.
- Pause the listing after a grace period, if the client chooses, and tell the seller.

**Benefit:** Keeps information and prices current.

### PRD-CAT-026 Service listings

| Key facts |  |
|---|---|
| Phase | Phase 1 |
| Pack | Services and bookings pack (optional) |
| For | Business buyers and shoppers |
| Availability | Planned for phase 1 |

Lets the shop list services, not physical goods, with service details and the area covered. How a booked service is confirmed as delivered is handled by service order completion.

**Who uses it:** Service providers; shoppers

**What it does**

- Let sellers create a service listing from a service template, where the client switches services on.
- Record service type, delivery method, areas covered and qualifications (proposed, to be confirmed).
- Refuse a service for an address outside the areas it covers.
- Show the service description, delivery method, areas covered and price.

**Rules**

- Proposed, to be confirmed: services are not shipped and are not offered for return; a failed service follows the service completion process.

**Benefit:** The same shop can sell services as well as products.

### PRD-CAT-027 Service booking

| Key facts |  |
|---|---|
| Phase | Phase 1 |
| Pack | Services and bookings pack (optional) |
| For | Business buyers and shoppers |
| Availability | Depends on a pending decision: whether postal operations, e-Government services and Malawi Post financial services are part of the product (Malawi Post to decide) (ref FG-06) |

A calendar of available time slots where customers book a service.

**Who uses it:** Shoppers; service providers; citizens; staff

**What it does**

- Show free time slots by day with the places left; full slots cannot be chosen.
- Confirm the booking when the order is placed, and free the place if the order is cancelled.
- Proposed, to be confirmed: let staff add slots with start, end, number of places and an optional outlet.
- Proposed, to be confirmed: hold a chosen slot for the shopper until a time limit passes.
- Proposed, to be confirmed: let citizens book a slot at an outlet for the in-person step of an e-government service, without a basket.
- Proposed, to be confirmed: let service providers move, cancel and close bookings so the number of places stays right.

**Rules**

- Two shoppers can never take the last place at the same time.

**Benefit:** Customers pick a time that suits them, and providers are not double-booked.

### PRD-CAT-028 Listing map location

| Key facts |  |
|---|---|
| Phase | Phase 2 |
| Pack | Services and bookings pack (optional) |
| For | Business buyers and shoppers |
| Availability | Planned for phase 2 |

Records a listing's map location and shows it on a map. An area, for example a farm plot, can be drawn as a shape.

**Who uses it:** Shoppers; catalogue staff

**What it does**

- Record a listing's map position.
- Show the point or shape on a map on the product page, where a map service is set up.
- Proposed, to be confirmed: draw an area as a closed shape on the map.

**Rules**

- Positions outside valid map ranges are refused.

**Benefit:** Customers can see where a product or service is located.

### PRD-CAT-029 Product reviews and ratings

| Key facts |  |
|---|---|
| Phase | Phase 1 |
| Pack | Always included |
| For | Business buyers and shoppers |
| Availability | Planned for phase 1 |

Customers write reviews and give star ratings, which are moderated; others can mark reviews helpful; reviews can be limited to people who bought the product.

**Who uses it:** Shoppers; catalogue staff

**What it does**

- Let customers write a review with title, text and star rating.
- Limit reviews to people who bought the product, and to one review per product, if the client chooses.
- Hold reviews for approval before they show, if the client chooses.
- Let other customers mark reviews helpful or not helpful.
- Let staff reply under a review and notify the reviewer, if the client chooses.
- Use a "prove you are human" check on reviews, if the client chooses.

**Benefit:** Honest feedback helps others decide.

### PRD-CAT-030 Non-returnable products

| Key facts |  |
|---|---|
| Phase | Phase 1 |
| Pack | Always included |
| For | Business buyers and shoppers |
| Availability | Planned for phase 1 |

Marks products that cannot be returned, in line with the returns policy.

**Who uses it:** Sellers; shoppers; client staff

**What it does**

- Let sellers mark a product as not returnable, so it is not offered on the return request page.
- Proposed, to be confirmed: show a "cannot be returned" label near the price.
- Proposed, to be confirmed: mark products in categories the returns policy excludes as not returnable automatically, without the seller being able to change it.

**Benefit:** Avoids disputes about non-returnable items.

### PRD-CAT-031 Delivery promise on the product page

| Key facts |  |
|---|---|
| Phase | Phase 1 |
| Pack | Always included |
| For | Business buyers and shoppers |
| Availability | Planned for phase 1 |

The product page shows price, seller, delivery options, estimated delivery time and a returns summary. It also explains how disputes are resolved; the returns and disputes summaries also appear on the order page.

**Who uses it:** Shoppers

**What it does**

- Show the seller's name with a link to the seller page.
- List delivery options and fees for the shopper's location.
- Show the estimated delivery window, or the product's standard delivery time where no location is known.
- Show when pickup is available.
- Show summaries of the returns policy and the disputes process, with links, on the product page and the order page.
- State when an item cannot be returned.

**Rules**

- Proposed, to be confirmed: a summary is not shown, and no broken link appears, if its policy page is not published.

**Benefit:** Customers know what to expect before buying.

### PRD-CAT-032 Catalogue change record

| Key facts |  |
|---|---|
| Phase | Phase 2 |
| Pack | Always included |
| For | Business buyers and shoppers |
| Availability | Planned for phase 2 |

Records who viewed or changed what on a product, from which internet address, with old and new values.

**Who uses it:** Auditors; catalogue managers

**What it does**

- Show, per listing, every change, stage change and approval decision with time, user, internet address, and old and new values.
- Record each time staff open a product for editing.

**Rules**

- Proposed, to be confirmed: only users with audit rights can open the record.

**Benefit:** Accountability for product and price changes.

### PRD-CAT-033 Paid featured listings

| Key facts |  |
|---|---|
| Phase | Phase 1 |
| Pack | Marketplace pack (optional) |
| For | Sellers and staff (back office) |
| Availability | Planned for phase 1 |

Sellers can pay to feature their products in prominent places, under rules, schedules and fees the client sets.

**Who uses it:** Sellers; marketing staff; clients

**What it does**

- Set up placement types, such as home page, featured in category, search boost and banner, with fees per period.
- Let sellers request a placement for a published product and dates.
- Let marketing staff approve requests; placements start and end automatically on their dates.
- Proposed, to be confirmed: suspend a placement if its product stops being published.
- Proposed, to be confirmed: charge the fee to the seller in the seller settlement.

**Rules**

- A request is refused if it would exceed the number of places available for any day.

**Benefit:** An extra revenue stream for the client.

### PRD-CAT-034 Catalogue analytics

| Key facts |  |
|---|---|
| Phase | Phase 1 |
| Pack | Analytics pack (optional) |
| For | Business buyers and shoppers |
| Availability | Depends on a pending decision: whether a licensed add-on is bought or the capability is built (technical and Product Owner decision) (ref PAID-STUB) |

Reports on product views, how often views turn into sales, out-of-stock rates and why listings were rejected. It also shows wish list and basket additions, how shoppers narrow results, and how many visitors leave at once.

**Who uses it:** Catalogue and marketing staff

**What it does**

- Count listings by stage and category, the out-of-stock rate and rejections by reason.
- Show views, basket and wish list additions, orders and conversion per product and category.
- Show how often listed products are clicked from category pages and search results.
- Show how shoppers narrow results and how many leave at once, where web analytics is connected; otherwise show "not available".

**Benefit:** Shows which products work and what to improve.

### PRD-CAT-035 Product feeds to other marketplaces

| Key facts |  |
|---|---|
| Phase | Phase 2 |
| Pack | Commerce extensions pack (optional) |
| For | Business buyers and shoppers |
| Availability | Planned for phase 2 |

Sends product information to other marketplaces and shopping comparison sites.

**Who uses it:** Marketing staff

**What it does**

- Set up a feed target with format, product selection and schedule.
- Send published products that are in stock or can be back-ordered.
- Remove withdrawn or paused products at the next run.
- Proposed, to be confirmed: mark a failed run and tell staff.

**Benefit:** Reaches more buyers outside the shop.

### PRD-CAT-036 Product ranges by buyer group

| Key facts |  |
|---|---|
| Phase | Phase 1 |
| Pack | Business trade pack (optional) |
| For | Business buyers |
| Availability | Planned for phase 1 |

Shows different product ranges to different customer groups, for example bulk tea for traders and packaged tea for retail shoppers.

**Who uses it:** Shoppers; business buyers; client administrators; sales staff

**What it does**

- List ranges, such as bulk tea and packaged tea, separately in navigation and category pages.
- Hide a range and its category from customers outside the group it is meant for.
- Show a range only in the storefront for its business model.

**Benefit:** Each audience sees what is relevant to them.

### PRD-CAT-037 Order quantity rules

| Key facts |  |
|---|---|
| Phase | Phase 2 |
| Pack | Always included |
| For | Business buyers and shoppers |
| Availability | Planned for phase 2 |

Sets minimum, maximum and allowed multiples of quantity per product, for example sold only in cartons of 12. Orders above the maximum can be sent for approval instead of being refused.

**Who uses it:** Business buyers; sales staff

**What it does**

- Set a minimum and maximum quantity per product, with a warning when a quantity is outside them.
- Set a quantity multiple, for example 12, and refuse quantities that are not a multiple.
- Proposed, to be confirmed: let a buyer send a quantity above the maximum for approval, and add it to the basket once approved.

**Benefit:** Prevents orders in quantities that cannot be supplied.

### PRD-CAT-038 Guided listing form for sellers

| Key facts |  |
|---|---|
| Phase | Phase 1 |
| Pack | Marketplace pack (optional) |
| For | Sellers and staff (back office) |
| Availability | Planned for phase 1 |

A step-by-step form that guides sellers through creating a listing, adapted to the category.

**Who uses it:** Sellers

**What it does**

- Show steps for identification, options, pricing, media, compliance and tax, with the category's required details marked.
- Stop the seller moving on while a required detail is missing, naming it.
- Submit the finished listing for review with the same checks as the staff form.
- Proposed, to be confirmed: keep a part-finished listing as a draft and resume at the first incomplete step.

**Benefit:** Sellers create complete listings without training.

### PRD-CAT-039 Customer and company price lists

| Key facts |  |
|---|---|
| Phase | Phase 1 |
| Pack | Business trade pack (optional) |
| For | Business buyers |
| Availability | Depends on a pending decision: confirmation by the client that this feature is needed in phase 1 (it was placed there by inference from the client documents) (ref PH-INF) |

Special price lists for a particular company, customer or customer group, including contract prices with validity dates, which take priority over standard prices. Price lists come ready-made with the current product base.

**Who uses it:** Business buyers; sales staff

**What it does**

- Set a price list with product prices, or a percentage or amount up or down, with validity dates and a priority, and give it to customers or customer groups; a company gets it through its own group.
- Show and charge the list price to those buyers within the dates, instead of the standard price.
- Choose whether a buyer in several price lists gets the lowest price or the list with the highest priority.
- Load and download price lists as spreadsheets.
- Use an accepted quote price before the price list.
- Record every change to a price list.
- Proposed, to be confirmed: list every product where a quantity price and a price list both apply, so staff can resolve it.

**Rules**

- Where a quantity price also applies to the same buyer, the quantity price is charged; contract products should therefore carry no quantity price for the same buyers.
- Price lists apply in every shop of the client and are set in the main currency; a fixed price in another currency does not replace a contract price.
- Where any price list is given to a single customer, the shop does not keep ready-calculated prices, so each customer always sees their own price.

**Benefit:** Supports negotiated prices for key customers.

### PRD-CAT-040 Company-specific product range

| Key facts |  |
|---|---|
| Phase | Phase 2 |
| Pack | Business trade pack (optional) |
| For | Business buyers |
| Availability | Depends on a pending decision: confirmation by the client that this feature is needed in phase 1 (it was placed there by inference from the client documents) (ref PH-INF) |

Controls exactly which products each company can see, beyond the standard customer-group rules.

**Who uses it:** Business buyers; sales staff

**What it does**

- Proposed, to be confirmed: list the products agreed for a company, so its buyers see them and products agreed only for other companies are hidden.
- Proposed, to be confirmed: apply the company range in browsing, search and product pages.
- Proposed, to be confirmed: give a new company member the company range at once, and remove it when they leave.

**Rules**

- Proposed, to be confirmed: products in no company range follow the normal visibility rules.

**Benefit:** Companies see only the products agreed for them.

### PRD-CAT-041 Units of measure and pack selling

| Key facts |  |
|---|---|
| Phase | Phase 1 |
| Pack | Business trade pack (optional) |
| For | Business buyers |
| Availability | Depends on a pending decision: confirmation by the client that this feature is needed in phase 1 (it was placed there by inference from the client documents) (ref PH-INF); whether products must be sold in fractional quantities such as 2.5 kg (KTDA and Product Owner) (ref UOM-01) |

Sell by kilogram, chest or carton, with pack sizes and prices based on weight.

**Who uses it:** Business buyers

**What it does**

- Define pack sizes, such as 1 kg or a chest, and price them from a price per base unit, showing the price per kilogram.
- Accept part quantities such as 2.5 kg, if the client decides to sell in part quantities (decision pending).
- Proposed, to be confirmed: define units with a code, name, base unit and conversion factor.

**Rules**

- Whether quantities are whole packs or part quantities is still to be decided.
- Proposed, to be confirmed: a conversion factor of zero or below is refused.

**Benefit:** Matches how bulk goods such as tea are really traded.

### PRD-CAT-042 Fixed prices per currency

| Key facts |  |
|---|---|
| Phase | Phase 1 |
| Pack | Always included |
| For | Business buyers and shoppers |
| Availability | Depends on a pending decision: confirmation by the client that this feature is needed in phase 1 (it was placed there by inference from the client documents) (ref PH-INF) |

Set a fixed price in each currency instead of converting from the main currency.

**Who uses it:** International buyers; sales staff; finance staff

**What it does**

- Set a fixed price for a product in a currency, which shoppers in that currency see and pay exactly.
- Record on the order that fixed prices were used.
- Show each shopper the price for their own currency.
- Show deductions or charges from other parts of the product, such as wallet use, as separate lines in the order total, and record them on the order.
- Proposed, to be confirmed: show the converted price where no fixed price is set.
- Proposed, to be confirmed: record every change to a fixed price.

**Rules**

- An order total is never below zero.

**Benefit:** Prices in foreign currencies stay stable and round.

### PRD-CAT-043 Seller listing review

| Key facts |  |
|---|---|
| Phase | Phase 1 |
| Pack | Marketplace pack (optional) |
| For | Sellers and staff (back office) |
| Availability | Depends on a pending decision: whether the workflow engine is built or an existing product is embedded (architecture decision) (ref WF-ENG) |

Client staff review products submitted by sellers and approve, reject or request changes, with reasons.

**Who uses it:** Client staff; approvers; sellers; client administrators

**What it does**

- Show approvers each seller listing with seller, category, submission time, quality-check result and policy flags.
- Approve, reject or ask for changes, choosing a reason from a list or writing one.
- Show the seller the decision, reason and time, and notify them.
- Send listings to review queues by seller level and other rules.

**Rules**

- A reason is required to reject or ask for changes, and every decision is recorded.
- Listings submitted by staff follow the staff review queues, not the seller queues.

**Benefit:** Keeps the quality of marketplace listings high.

<!-- pagebreak -->

## 7.5 Inventory and warehouses

This part of the product keeps an accurate count of every product in stock, in every warehouse, store or postal facility. It shows shoppers what is available, holds stock while they pay, and records every change to stock with a reason. Optional warehouse features add receiving, transfers, stock counts, batch, serial number and expiry tracking, a link to the client's warehouse or ERP (business management) system, and stock reports for managers.

### PRD-INV-001 Stock tracking

| Key facts |  |
|---|---|
| Phase | Phase 1 |
| Pack | Always included |
| For | Business buyers and shoppers |
| Availability | Planned for phase 1 |

The platform keeps count of how many of each product, and each version of it, are in stock. It shows shoppers whether an item is available and keeps a history of every stock change.

**Who uses it:** Shoppers; stock staff; client administrators; sellers

**What it does**

- Shoppers see whether a product is in stock, low in stock or out of stock before they order.
- Stock goes down automatically when an order is placed and goes back up when an order is cancelled.
- Stock can be kept for each version of a product, for example each size or pack.
- Shoppers see the lowered stock straight away after another order; figures are not updated in batches.
- Administrators decide per product whether orders are allowed when stock runs out.
- Stock staff open a full history of every stock change, with date, quantity, warehouse and reason.

**Rules**

- When a product does not allow orders below zero stock, the cart refuses more than is in stock.
- Sellers can change stock only on their own products, and only through a recorded stock adjustment (PRD-INV-005).

**Benefit:** Shoppers do not buy items that are not there, and staff know what to restock.

### PRD-INV-002 Stock in several warehouses

| Key facts |  |
|---|---|
| Phase | Phase 1 |
| Pack | Always included |
| For | Business buyers and shoppers |
| Availability | Planned for phase 1 |

The platform tracks stock separately in each warehouse or store and adds it up to show total availability. Each warehouse or postal facility has its own code and map position.

**Who uses it:** Stock staff; client administrators

**What it does**

- Stock staff see, for each warehouse, the stock held, the stock reserved for orders, the stock available and the stock on the way from another warehouse.
- Shoppers see total availability across all warehouses.
- Administrators give each warehouse or postal facility a code and map coordinates.
- Warehouse locations are used for nearby searches and for choosing the nearest warehouse for delivery.

**Rules**

- Proposed: each warehouse code must be unique and map coordinates must be valid, to be confirmed.
- Stock on the way between warehouses shows as zero until warehouse transfers (PRD-INV-007) are in use.

**Benefit:** Clients with several warehouses, factories or post offices see where their stock is.

### PRD-INV-003 Low-stock levels and alerts

| Key facts |  |
|---|---|
| Phase | Phase 1 |
| Pack | Always included |
| For | Business buyers and shoppers |
| Availability | Planned for phase 1 |

The client sets a minimum stock level for each product. When stock falls below it, staff or the seller receive an alert and the product appears on a low-stock report.

**Who uses it:** Stock staff; sellers

**What it does**

- Stock staff set a minimum stock level and an alert level for each product.
- Staff receive an email when stock falls below the alert level.
- Sellers set the levels for their own products and receive the alerts themselves.
- Staff open a low-stock report listing everything that needs restocking, and download it as a spreadsheet; sellers see only their own products.
- The client can choose to switch off the buy button when stock reaches the minimum level.

**Rules**

- The alert is sent only when stock goes down and ends below the alert level.
- Proposed: stock corrections, receipts, transfers and counts trigger the same alerts as orders, to be confirmed.

**Benefit:** Popular items are restocked before they run out.

### PRD-INV-004 Stock hold while the customer pays

| Key facts |  |
|---|---|
| Phase | Phase 1 |
| Pack | Always included |
| For | Business buyers and shoppers |
| Availability | Planned for phase 1 |

Stock is held for a shopper when they start checkout and, if the client chooses, when they add it to the cart. Unpaid orders get reminders, and the client decides what happens when the time to pay runs out.

**Who uses it:** Shoppers; stock staff; finance staff; client administrators

**What it does**

- Items are held for a set time when a shopper starts checkout, and optionally when they add items to the cart.
- Other shoppers cannot take stock that is held, and see a message when the item is held by someone else.
- A hold ends on its own when its time runs out; the item stays in the shopper's cart and is checked again when they order.
- Shoppers with an unpaid order receive reminders to pay, with a link to pay again.
- For each payment method, the client sets the time allowed to pay and what happens after it: remind again, flag for follow-up, or cancel the order and return the stock.
- Stock staff see all active holds on a product.
- Proposed: finance staff see a list of flagged unpaid orders and can release the order or dismiss the flag with a reason, to be confirmed.

**Rules**

- An order is never cancelled if a payment has succeeded or the order has been shipped.
- Payment methods with no time limit (for example cash on delivery, letter of credit or buying on account) are never reminded or cancelled.
- No reminder is sent once an order is paid or cancelled, and reminders stop at the number the client sets.
- Products that do not track stock, or that allow orders when out of stock, are not held.
- Proposed, to be confirmed: the simpler ready-made automatic cancellation and email reminders of the current product base stay switched off, because they use one time limit for all payment methods, send emails only and do not check for a payment arriving at the same moment.

**Benefit:** Two people cannot buy the last item, and stock is not locked forever by orders that will never be paid.

### PRD-INV-005 Stock corrections with reasons

| Key facts |  |
|---|---|
| Phase | Phase 1 |
| Pack | Always included |
| For | Staff (back office) |
| Availability | Planned for phase 1 |

Staff correct stock levels, for example after damage or loss, by choosing a reason. Large corrections need approval by a second person, and every change is recorded.

**Who uses it:** Stock staff; approvers; auditors; sellers

**What it does**

- Stock staff correct the stock of a product in a chosen warehouse and choose a reason such as damage or loss.
- Corrections above an approval limit wait for approval and do not change stock until approved.
- Approvers approve or reject a correction; a rejection needs a reason.
- Auditors see who made each change, why and when.
- Stock can no longer be changed directly on the product page; all changes go through a recorded correction.
- Returned goods that are put back on the shelf are added to stock with the reason "Return".

**Rules**

- A reason is required for every correction.
- Proposed: a person cannot approve their own correction, to be confirmed.
- Proposed: a correction cannot take available stock below zero unless the product allows it, to be confirmed.
- Corrections backed by a document (receipt, transfer, count, ERP update, return) do not need a separate approval.

**Benefit:** Stock figures stay accurate and every loss is explained.

### PRD-INV-006 Goods receiving

| Key facts |  |
|---|---|
| Phase | Phase 1 |
| Pack | Always included |
| For | Staff (back office) |
| Availability | Planned for phase 1 |

Warehouse staff record goods arriving against the purchase order, note any shortage or damage, and record where the goods are stored.

**Who uses it:** Warehouse staff; quality staff

**What it does**

- Staff record the goods received for some or all lines of a purchase order.
- Accepted goods are added to stock straight away.
- Shortages and damaged units are recorded as differences, and the purchase order stays open for the rest.
- Staff record the storage location (zone, aisle, rack, shelf, bin) so goods can be found for picking.
- Proposed: goods that need inspection are added to stock only after quality staff pass them, to be confirmed.
- For batch- or serial-tracked products, staff record the batch details or one serial number per unit.

**Rules**

- Damaged units are not added to stock.
- Proposed: receipts without a purchase order are refused unless the client allows them, to be confirmed.
- Proposed: receiving more than ordered, beyond a set tolerance, is refused, to be confirmed.

**Benefit:** Stock levels are right from the moment goods arrive.

### PRD-INV-007 Warehouse transfers

| Key facts |  |
|---|---|
| Phase | Phase 2 |
| Pack | Warehouse pack (optional) |
| For | Staff (back office) |
| Availability | Planned for phase 2 |

Staff move stock between warehouses. While on the way, the stock shows as "in transit".

**Who uses it:** Warehouse staff

**What it does**

- Staff create a transfer and dispatch it; stock leaves the sending warehouse.
- The receiving warehouse records the goods that arrive, and its stock goes up.
- Stock in transit is not available for sale anywhere.
- Proposed: if fewer units arrive than were sent, the missing units become a stock correction for approval, to be confirmed.
- Every change to a transfer is recorded with the user, time and quantities.

**Rules**

- Proposed: a transfer cannot be dispatched if the sending warehouse does not have enough stock, to be confirmed.
- Only products that are stocked in more than one warehouse can be transferred.

**Benefit:** Stock is not lost or counted twice during transfers.

### PRD-INV-008 Cycle counts

| Key facts |  |
|---|---|
| Phase | Phase 2 |
| Pack | Warehouse pack (optional) |
| For | Staff (back office) |
| Availability | Planned for phase 2 |

Regular partial stock counts run on a schedule. Differences are investigated and corrected.

**Who uses it:** Warehouse staff; stock staff

**What it does**

- Staff set up count plans by warehouse, category, product importance or product list, with a frequency.
- Counts are created automatically when a plan is due.
- Staff can also plan full counts of high-value or controlled stock.
- Differences between counted and recorded stock are shown and posted as stock corrections.
- Proposed: counters can count without seeing the recorded quantity, to be confirmed.
- Proposed: large differences are sent for a recount before posting, to be confirmed.

**Rules**

- Count differences follow the same approval limit as other stock corrections (PRD-INV-005).
- Proposed: the difference takes into account stock movements made after the count started, to be confirmed.

**Benefit:** Stock records stay accurate without closing for a full count.

### PRD-INV-009 Batch and lot tracking

| Key facts |  |
|---|---|
| Phase | Phase 2 |
| Pack | Warehouse pack (optional) |
| For | Business buyers and shoppers |
| Availability | Planned for phase 2 |

The platform records the batch (lot) number of goods with manufacture and expiry dates, and which customers received each batch. Quality test results and the chain of custody are recorded too.

**Who uses it:** Quality staff; warehouse staff; shoppers

**What it does**

- Staff record the batch number, manufacture date and expiry date when goods are received.
- Quality staff record test results for each batch; a failed batch is blocked from sale.
- Staff record who held the batch and when; earlier custody records cannot be changed.
- Staff choose the batch for each item when it is shipped.
- Quality staff recall a batch; its remaining stock stops being sold and a list of every order, customer, quantity and shipment date for that batch is produced.
- Proposed: the platform regularly checks batch quantities against stock and lists any differences, to be confirmed.

**Rules**

- Batch tracking is available only for products whose stock is tracked as a whole, not by product version.
- Blocked, expired, recalled and quarantined batches are not available for sale.

**Benefit:** If a batch has a problem, affected customers can be found and the batch recalled.

### PRD-INV-010 Serial number tracking

| Key facts |  |
|---|---|
| Phase | Phase 2 |
| Pack | Warehouse pack (optional) |
| For | Business buyers and shoppers |
| Availability | Planned for phase 2 |

The platform records the unique serial number of each unit, from arrival to sale, and who bought it.

**Who uses it:** Support staff; warehouse staff; shoppers

**What it does**

- Warehouse staff record one serial number per unit when goods are received.
- Staff record the serial numbers of the units in each shipment.
- Support staff search a serial number and see the product, order, customer, shipment date and its history.
- Proposed: a returned unit that is put back on the shelf becomes available again, to be confirmed.
- Proposed: differences between serial numbers in stock and recorded stock are listed for checking, to be confirmed.

**Rules**

- Each unit needs exactly one serial number, and a serial number is used once per product.
- Proposed: an unknown serial number, or one not in stock, cannot be shipped, to be confirmed.

**Benefit:** Supports warranties and tracing of high-value items.

### PRD-INV-011 Expiry management

| Key facts |  |
|---|---|
| Phase | Phase 2 |
| Pack | Warehouse pack (optional) |
| For | Business buyers and shoppers |
| Availability | Planned for phase 2 |

The platform tracks expiry dates per batch, picks the batches that expire soonest first, flags items close to expiry and stops expired items from being sold.

**Who uses it:** Warehouse staff; stock staff; shoppers

**What it does**

- When a shipment is prepared, the batch that expires first is suggested; staff may choose only another sellable batch.
- Batches that reach their expiry date are taken out of sale automatically.
- Batches close to expiry appear on a near-expiry list and stock staff are notified once.
- Staff record the disposal of expired stock as a stock correction with the reason "Expiry".

**Rules**

- The client sets how many days before expiry an item counts as close to expiry.

**Benefit:** Less waste, and shoppers are not sold expired goods.

### PRD-INV-012 Stock link with the warehouse or ERP system

| Key facts |  |
|---|---|
| Phase | Phase 1 |
| Pack | Warehouse pack (optional) |
| For | Business buyers and shoppers |
| Availability | Depends on a pending decision: whether a licensed add-on is bought or the capability is built (technical and Product Owner decision) (ref PAID-STUB) |

Stock levels and stock movements are kept in step, in both directions, with the client's warehouse or ERP (business management) system. Stock values and purchase triggers are also passed to the ERP.

**Who uses it:** Stock staff; finance staff; IT team

**What it does**

- Proposed: stock levels sent by the ERP update the platform for each warehouse, to be confirmed.
- Proposed: every stock movement on the platform (orders, cancellations, shipments, corrections, receipts, transfers, counts) is sent to the ERP, to be confirmed.
- Proposed: stock quantity and value per product and warehouse are sent to the ERP on a schedule, to be confirmed.
- Purchase triggers are sent to the ERP when stock reaches the minimum level.
- Proposed: failed messages are retried and, if they still fail, are listed for the IT team, to be confirmed.

**Rules**

- Proposed: the same message is never applied twice, to be confirmed.
- Proposed: when both systems changed the same stock, the system the client names as the master wins and the conflict is listed for review, to be confirmed.

**Benefit:** One set of stock figures across all systems.

### PRD-INV-013 Stock reports

| Key facts |  |
|---|---|
| Phase | Phase 1 |
| Pack | Warehouse pack (optional) |
| For | Business buyers and shoppers |
| Availability | Planned for phase 1 |

Reports show how fast stock sells, how many days of stock are left, items that never sell and which items matter most.

**Who uses it:** Management; stock planners; sellers

**What it does**

- Proposed: managers see units sold, average daily sales and days of stock left per product for a chosen period, to be confirmed.
- Proposed: a report shows on how many days each product was out of stock, to be confirmed.
- Proposed: planners see items that have not sold within a set period, with their stock value, to be confirmed.
- Planners see products grouped into classes A, B and C by their share of sales value.
- The management dashboard of fast and slow movers uses the same stock figures as these reports.
- Proposed: sellers see only their own products, to be confirmed.

**Rules**

- Cancelled orders are not counted as sales.

**Benefit:** Better buying decisions and less money tied up in stock.

<!-- pagebreak -->

## 7.6 Search, discovery and merchandising

This part of the product helps shoppers find what they want, by typing, browsing categories, narrowing results or following suggestions. It gives marketing staff tools to run promotions, campaign pages and featured sellers without developers. It also covers alerts, wish lists, comparison, accessibility for people with disabilities, and search that keeps working on slow mobile networks.

### PRD-SRC-001 Keyword search

| Key facts |  |
|---|---|
| Phase | Phase 1 |
| Pack | Always included |
| For | Business buyers and shoppers |
| Availability | Planned for phase 1 |

Shoppers type words and the shop finds matching products by name, description, product code or tags. Products can also carry tags with their own tag pages.

**Who uses it:** Shoppers

**What it does**

- Shoppers use a search box that is on every page.
- Shoppers use an advanced search form, for example by category with sub-categories, brand or seller.
- Products are found by name, description, tags, or the exact product code of a product or one of its versions.
- Shoppers search in the language they are using on the site.
- Shoppers open a tag page to see all products with the same tag.
- Shoppers type a request in everyday language, such as "black tea in 1 kg packs", and the best matches come first, when the client chooses the Google search service that comes with the platform.
- If the enhanced search engine fails or finds nothing, the standard search answers instead.

**Rules**

- A search term must reach a minimum length set by the client.
- The Google search service is used only if the client agrees to send its product list and visitor identifiers to Google; this data-protection approval is to be confirmed for Kenya and Malawi.
- By default the Google search service answers signed-in shoppers only; the client can extend it to guests.
- If the client does not use the Google search service, everyday-language search is built into the product search engine instead.

**Benefit:** Shoppers find products by typing what they want.

### PRD-SRC-002 Suggestions while typing

| Key facts |  |
|---|---|
| Phase | Phase 1 |
| Pack | Always included |
| For | Business buyers and shoppers |
| Availability | Planned for phase 1 |

Product suggestions with pictures appear while the shopper is still typing.

**Who uses it:** Shoppers

**What it does**

- Shoppers see a set number of product suggestions with pictures as they type.
- A "view all results" link appears when more products match than are shown.
- When the shopper has chosen a category in the search box, suggestions come only from that category.

**Rules**

- Suggestions start only after a minimum number of characters is typed.

**Benefit:** Faster searching and fewer spelling problems.

### PRD-SRC-003 Narrowing results

| Key facts |  |
|---|---|
| Phase | Phase 1 |
| Pack | Always included |
| For | Business buyers and shoppers |
| Availability | Planned for phase 1 |

Shoppers narrow search results and category pages by price range, grade, size, brand, seller and "in stock".

**Who uses it:** Shoppers

**What it does**

- Shoppers set a price range.
- Shoppers tick product characteristics such as grade or size.
- Shoppers choose a brand or a seller.
- Shoppers show only items that can be bought now.
- Shoppers limit search results to a category and its sub-categories.
- Proposed: the same choices are offered on category pages and on the search page, to be confirmed.

**Rules**

- Choices within one characteristic widen the list (either option); choices across different characteristics narrow it (both).

**Benefit:** Shoppers narrow a long list down to what they want.

### PRD-SRC-004 Finding items by location and delivery option

| Key facts |  |
|---|---|
| Phase | Phase 1 |
| Pack | Postal and logistics pack (optional) |
| For | Business buyers and shoppers |
| Availability | Planned for phase 1 |

Shoppers browse by district, distance or delivery option, or find items available for pickup at a nearby outlet.

**Who uses it:** Shoppers

**What it does**

- Proposed: shoppers choose a district and see only products in stock in that district, to be confirmed.
- Proposed: shoppers give their location, with consent, and see products within a chosen distance, to be confirmed.
- Proposed: shoppers choose a delivery option, such as home delivery or pickup, and see only products that can be delivered that way to their district, to be confirmed.
- Shoppers choose an outlet or a district and see the products available for pickup there, with the outlets that have them.

**Rules**

- Proposed: if the shopper gives no location, the platform asks for a district instead, to be confirmed.
- Each client defines what a district is in its own addresses.

**Benefit:** Shoppers see what they can actually get where they are.

### PRD-SRC-005 Sorting options

| Key facts |  |
|---|---|
| Phase | Phase 1 |
| Pack | Always included |
| For | Business buyers and shoppers |
| Availability | Planned for phase 1 |

Shoppers sort results by relevance, name, price, newest, popularity or place of origin.

**Who uses it:** Shoppers

**What it does**

- Shoppers sort by name, price or newest.
- Search results can be shown with the best matches first.
- Proposed: shoppers sort by popularity, based on units sold in a set period, to be confirmed.
- Proposed: shoppers sort by place of origin, to be confirmed.

**Benefit:** Shoppers compare products quickly.

### PRD-SRC-006 Category browsing

| Key facts |  |
|---|---|
| Phase | Phase 1 |
| Pack | Always included |
| For | Business buyers and shoppers |
| Availability | Planned for phase 1 |

Category pages show a "you are here" trail, sub-categories, featured items and a grid or list view.

**Who uses it:** Shoppers

**What it does**

- Shoppers see the path from the home page to the current category.
- Shoppers see sub-categories with pictures and, if the client chooses, their products.
- Shoppers see featured products in their own block on a category page.
- Shoppers switch between grid and list views.
- Shoppers reach categories from the main menu, the category pages and the "you are here" trail.

**Benefit:** Easy browsing for shoppers who do not search.

### PRD-SRC-007 Promotions, collections and campaign pages

| Key facts |  |
|---|---|
| Phase | Phase 1 |
| Pack | Always included |
| For | Business buyers and shoppers |
| Availability | Planned for phase 1 |

Marketing staff build menus, sliders, product carousels, curated collections and campaign pages without developers. Labels such as "New" or "Sale" can be shown on product pictures.

**Who uses it:** Marketing staff; shoppers

**What it does**

- Marketing staff build the main and footer menus from categories, brands, sellers, products, pages or links.
- Marketing staff set up rotating home-page slides.
- Marketing staff create product carousels and collections from a chosen list or a rule, such as a category, tag, new or on sale.
- Banners and featured categories appear and disappear on set dates.
- Marketing staff build campaign landing pages from blocks such as text, carousels and banners.
- Shoppers see a "New" or "Sale" label on product pictures.

**Benefit:** Promotions and seasonal campaigns run on time without developers.

### PRD-SRC-008 Rule-based suggestions

| Key facts |  |
|---|---|
| Phase | Phase 1 |
| Pack | Engagement and loyalty pack (optional) |
| For | Business buyers and shoppers |
| Availability | Planned for phase 1 |

The shop shows related products, "customers also bought", recently viewed items and new arrivals using simple rules.

**Who uses it:** Shoppers; clients

**What it does**

- Shoppers see related products on a product page.
- Shoppers see suggested add-on products in the cart.
- Shoppers see products bought in the same orders as the one they are viewing.
- Shoppers see the products they viewed recently.
- Shoppers open a page of new arrivals.

**Rules**

- Proposed: products that cannot be bought are not suggested, to be confirmed.

**Benefit:** Shoppers discover more products and spend more.

### PRD-SRC-009 Personalised suggestions and ranking

| Key facts |  |
|---|---|
| Phase | Phase 1 |
| Pack | Analytics pack (optional) |
| For | Business buyers and shoppers |
| Availability | Planned for phase 1 |

Suggestions and search results are ordered by what each shopper has browsed and bought, only with their consent.

**Who uses it:** Shoppers; clients

**What it does**

- Shoppers who give consent receive suggestions based on their browsing and buying.
- Search results for shoppers who give consent can be ordered by what is most relevant to them.
- Shoppers who do not give consent see only rule-based suggestions (PRD-SRC-008).
- Proposed: when a shopper withdraws consent, use of their behaviour stops at once and their data is deleted from the suggestion service, to be confirmed.
- Proposed: if the suggestion service is not available, rule-based suggestions are shown instead, to be confirmed.

**Rules**

- No personal data is used for suggestions without the shopper's consent.
- If the client uses the Google search service, Google receives a visitor identifier with each search and may order results for that visitor; the client must confirm this is acceptable under its data-protection law.

**Benefit:** More relevant suggestions for each shopper, with their choice respected.

### PRD-SRC-010 Wish list

| Key facts |  |
|---|---|
| Phase | Phase 1 |
| Pack | Always included |
| For | Business buyers and shoppers |
| Availability | Planned for phase 1 |

Shoppers save products to a wish list, share it by email and move items to the cart later.

**Who uses it:** Shoppers

**What it does**

- Shoppers save products to a wish list, as registered or guest shoppers.
- Shoppers send their wish list to a friend by email.
- Shoppers move chosen items from the wish list to the cart.
- If the client allows it, shoppers keep several named wish lists.

**Rules**

- The client sets the maximum number of items and of wish lists.

**Benefit:** Shoppers can come back and buy later.

### PRD-SRC-011 Saved searches and watch alerts

| Key facts |  |
|---|---|
| Phase | Phase 2 |
| Pack | Always included |
| For | Business buyers and shoppers |
| Availability | Planned for phase 2 |

Shoppers save a search or watch a product and are told when new matches appear, the price drops or it is back in stock.

**Who uses it:** Shoppers

**What it does**

- Proposed: registered shoppers save a search with its choices, up to a set number, to be confirmed.
- Proposed: shoppers receive one alert listing new products that match a saved search, to be confirmed.
- Proposed: shoppers watching a product receive an alert when its price drops, to be confirmed.
- Shoppers ask to be told when an out-of-stock product is back in stock.
- Proposed: shoppers stop an alert using the unsubscribe link in it, to be confirmed.

**Benefit:** Brings shoppers back at the right moment.

### PRD-SRC-012 Search history

| Key facts |  |
|---|---|
| Phase | Phase 2 |
| Pack | Always included |
| For | Business buyers and shoppers |
| Availability | Planned for phase 2 |

Shoppers see their recent searches and recently viewed products and repeat a search with one tap.

**Who uses it:** Shoppers

**What it does**

- The platform remembers each shopper's search terms, as a standard part of the platform.
- Shoppers see their recent searches when they click in the empty search box and repeat one with a tap.
- Shoppers remove searches from their history one at a time.
- The client switches the history on or off and sets how many recent searches are shown.

**Rules**

- Shoppers see only their own searches.
- Proposed: search history is deleted when the shopper's account is deleted under data-protection rules, to be confirmed.
- A single button to clear the whole history is not included; to be confirmed if a client needs it.

**Benefit:** Saves time for returning shoppers.

### PRD-SRC-013 Product comparison

| Key facts |  |
|---|---|
| Phase | Phase 1 |
| Pack | Always included |
| For | Business buyers and shoppers |
| Availability | Planned for phase 1 |

Shoppers put chosen products side by side to compare their details.

**Who uses it:** Shoppers

**What it does**

- Shoppers add products to a comparison list.
- Shoppers see name, price and each product characteristic side by side.

**Rules**

- The client sets how many products can be compared; adding one more removes the oldest.

**Benefit:** Easier, better-informed choices.

### PRD-SRC-014 Enhanced search engine: relevance, synonyms and languages

| Key facts |  |
|---|---|
| Phase | Phase 1 |
| Pack | Always included |
| For | Business buyers and shoppers |
| Availability | Depends on a pending decision: whether a licensed add-on is bought or the capability is built (technical and Product Owner decision) (ref PAID-STUB) |

A more powerful search engine ranks the best matches first, understands synonyms and word forms, tolerates typing mistakes and works across languages. Administrators set rules to promote results, and every change is recorded.

**Who uses it:** Shoppers; catalogue managers

**What it does**

- Shoppers see the best matches first.
- Catalogue managers set groups of words that mean the same, per language, so a search for one finds the others.
- Shoppers find a product when they type another form of a word, such as the plural.
- Proposed: shoppers find the intended product despite small typing mistakes, ranked below exact matches, to be confirmed.
- Shoppers search in the language they are using, with a fallback when nothing matches.
- Catalogue managers promote results by category, featured status or stock in the shopper's district.
- Every change to promotion rules and word groups is kept as a new version with who made it and when.

**Rules**

- Products that cannot be bought are never shown, even if the search engine has not yet caught up.
- A client that uses the Google search service gets its ranking from Google; promotion rules and searching in several languages are still built into the product.
- Staff searches in the back office use the standard search.

**Benefit:** Shoppers find what they mean, not only exact words.

### PRD-SRC-015 Trending and best sellers

| Key facts |  |
|---|---|
| Phase | Phase 2 |
| Pack | Analytics pack (optional) |
| For | Business buyers and shoppers |
| Availability | Planned for phase 2 |

Lists of best sellers, most viewed and trending products by region or category.

**Who uses it:** Shoppers; marketing staff

**What it does**

- Shoppers see best sellers on the home page.
- Shoppers see most viewed and trending products for a category or for their region.
- Proposed: the lists refresh by themselves at a set interval, with trending based on growth in views and sales, to be confirmed.

**Rules**

- Proposed: products that cannot be bought are not listed, to be confirmed.

**Benefit:** Shows shoppers what is popular, without staff maintaining lists by hand.

### PRD-SRC-016 Category structure control

| Key facts |  |
|---|---|
| Phase | Phase 1 |
| Pack | Commerce extensions pack (optional) |
| For | Business buyers and shoppers |
| Availability | Depends on a pending decision: whether the workflow engine is built or an existing product is embedded (architecture decision) (ref WF-ENG) |

A controlled process to propose, approve and retire product categories, with a record of every change.

**Who uses it:** Catalogue managers; approvers

**What it does**

- Catalogue managers propose a new category, a change or the retirement of a category, with a reason.
- Another person approves or rejects the proposal; a rejection needs a reason.
- Nothing changes in the shop until a proposal is approved.
- When a category is retired, it is hidden, no new products can be added to it, and a list of its products that need another category is produced.
- Every step is recorded with user, time, old and new values.

**Rules**

- While this process is on, categories cannot be created, changed or deleted directly.

**Benefit:** The category structure stays tidy and controlled as the catalogue grows.

### PRD-SRC-017 Seller badges and featured sellers

| Key facts |  |
|---|---|
| Phase | Phase 1 |
| Pack | Marketplace pack (optional) |
| For | Business buyers and shoppers |
| Availability | Planned for phase 1 |

Badges such as "verified" or "top rated" for sellers, and featured sellers for set dates.

**Who uses it:** Shoppers; sellers; marketing staff

**What it does**

- Marketing staff create badge types with a name and icon and give them to sellers.
- Shoppers see a seller's badges on the seller page and on the seller's product pages.
- Marketing staff feature sellers on the home page between set dates.
- Proposed: a badge with an end date stops showing after that date, to be confirmed.

**Rules**

- Proposed: badges and featured places of a deactivated seller are not shown, to be confirmed.

**Benefit:** Builds buyer trust and rewards good sellers.

### PRD-SRC-018 Delivery promise on product cards

| Key facts |  |
|---|---|
| Phase | Phase 1 |
| Pack | Postal and logistics pack (optional) |
| For | Business buyers and shoppers |
| Availability | Planned for phase 1 |

Product cards in search results and lists show the expected delivery time and whether pickup is available.

**Who uses it:** Shoppers

**What it does**

- Shoppers see the expected delivery time for their district on each product card.
- Shoppers see the same delivery time on the product page.
- Shoppers see "Pickup available" when the product can be collected at an outlet in their district.
- Proposed: when no delivery time can be worked out, no delivery text is shown, to be confirmed.

**Benefit:** Shoppers choose by delivery speed before opening the product.

### PRD-SRC-019 Which products appear in search

| Key facts |  |
|---|---|
| Phase | Phase 1 |
| Pack | Always included |
| For | Business buyers and shoppers |
| Availability | Planned for phase 1 |

Rules hide unpublished, suspended or out-of-stock products from search results.

**Who uses it:** Shoppers; client administrators

**What it does**

- Unpublished, deleted or out-of-date products never appear in search results.
- Products of a suspended seller are hidden from search and category pages.
- Proposed: products return to search when the seller is reinstated, to be confirmed.
- The client chooses whether out-of-stock items are hidden from search; if not hidden, the product page says it is out of stock.
- Products set to be hidden at a minimum stock level disappear from results when they reach it.

**Rules**

- Proposed: these rules do not apply to staff searches in the back office, to be confirmed.

**Benefit:** Shoppers do not see things they cannot buy.

### PRD-SRC-020 Services area

| Key facts |  |
|---|---|
| Phase | Phase 1 |
| Pack | Services and bookings pack (optional) |
| For | Business buyers and shoppers |
| Availability | Depends on a pending decision: whether postal operations, e-Government services and Malawi Post financial services are part of the product (Malawi Post to decide) (ref FG-06) |

A separate area of the shop for the operator's own services, such as postal, logistics or financial services.

**Who uses it:** Shoppers; Malawi Post

**What it does**

- Shoppers open a services entry in the main menu and see a services landing page and service categories.
- Shoppers read a description of each service and order it through the service ordering process (PRD-SVC-005).
- The client can show the services area only to chosen shoppers or shops.

**Benefit:** Services are easy to find apart from goods.

### PRD-SRC-021 Web analytics

| Key facts |  |
|---|---|
| Phase | Phase 1 |
| Pack | Always included |
| For | Business buyers and shoppers |
| Availability | Planned for phase 1 |

The shop connects to web analytics to measure what people click and buy after searching or browsing.

**Who uses it:** Marketing staff

**What it does**

- Product views, cart additions and purchases are sent to Google Analytics.
- Page views can be sent to Facebook Pixel.
- Marketing staff see a report of the most popular search terms.

**Rules**

- Proposed: analytics do not run unless the shopper accepts cookies where data-protection rules require it, to be confirmed.

**Benefit:** Shows what works so the shop can be improved.

### PRD-SRC-022 Accessible search and menus

| Key facts |  |
|---|---|
| Phase | Phase 1 |
| Pack | Always included |
| For | Business buyers and shoppers |
| Availability | Planned for phase 1 |

Search, suggestions, result choices and menus can be used with a keyboard only and are labelled for screen readers.

**Who uses it:** Shoppers with disabilities

**What it does**

- Shoppers use the search box and suggestions with the keyboard only.
- Shoppers reach and use every result choice and menu item with the keyboard.
- Screen readers read a label for each part and announce the number of suggestions.
- Proposed: an accessibility check confirms that search and menus meet the WCAG 2.1 AA standard, to be confirmed.

**Benefit:** People with disabilities can find products.

### PRD-SRC-023 Search on weak connections

| Key facts |  |
|---|---|
| Phase | Phase 1 |
| Pack | Always included |
| For | Business buyers and shoppers |
| Availability | Planned for phase 1 |

When the internet connection is weak, search shows clear messages and lets the shopper retry instead of failing.

**Who uses it:** Shoppers in low-connectivity areas

**What it does**

- Shoppers see a "search is slow" message with a retry button, and their typed text is kept.
- When the device is offline, shoppers see a message and the search is sent automatically once the connection returns.
- Proposed: if suggestions fail, pressing Enter still runs the normal search, to be confirmed.

**Rules**

- Proposed: automatic retries stop after a set number of attempts; the retry button stays, to be confirmed.

**Benefit:** Search works for shoppers on slow mobile networks.

### PRD-SRC-024 Search for other channels

| Key facts |  |
|---|---|
| Phase | Phase 1 |
| Pack | Analytics pack (optional) |
| For | Business buyers and shoppers |
| Availability | Depends on a pending decision: whether a licensed add-on is bought or the capability is built (technical and Product Owner decision) (ref PAID-STUB) |

A search service that other channels, such as USSD, SMS or kiosks, can use through a secure connection.

**Who uses it:** Shoppers on basic phones; channel systems

**What it does**

- Proposed: registered channel systems search products by keyword, to be confirmed.
- Proposed: results can be returned in a short form (name and price) that fits SMS or USSD screens, to be confirmed.

**Rules**

- Proposed: only registered and authorised channel systems can use the service, to be confirmed.
- Proposed: each channel system has a usage limit, to be confirmed.

**Benefit:** Shoppers without smartphones can still search.

### PRD-SRC-025 One search for everything

| Key facts |  |
|---|---|
| Phase | Phase 2 |
| Pack | Always included |
| For | Business buyers and shoppers |
| Availability | Planned for phase 2 |

One search box finds products, the user's own orders, quotes and their own records.

**Who uses it:** Shoppers; business buyers

**What it does**

- Signed-in buyers see results grouped into products, their own orders, and their own quote requests and quotes.
- Proposed: guests see only products, to be confirmed.

**Rules**

- Proposed: a buyer never sees another customer's orders in the results, to be confirmed.

**Benefit:** Users find anything from one place.

### PRD-SRC-026 Search speed and up-to-date results

| Key facts |  |
|---|---|
| Phase | Phase 2 |
| Pack | Always included |
| For | Business buyers and shoppers |
| Availability | Planned for phase 2 |

Search answers within a target time, and new or changed products appear in results without delay.

**Who uses it:** Shoppers

**What it does**

- With the standard search, a newly published product or a price change shows in the next search.
- Proposed: with the enhanced search engine, changed products are updated within a set time, to be confirmed.
- Proposed: search response times are measured against an approved target in load tests, to be confirmed.

**Benefit:** Shoppers see current stock and prices in search results without delay.

### PRD-SRC-027 Shop conveniences

| Key facts |  |
|---|---|
| Phase | Phase 2 |
| Pack | Always included |
| For | Individual shoppers |
| Availability | Planned for phase 2 |

Handy shop features: quick product preview, a "buy now" button, "email a friend", a delivery-cost estimate on the product page, and links to the previous and next product.

**Who uses it:** Shoppers

**What it does**

- Shoppers preview a product without leaving the list.
- Shoppers press "buy now" to add a product to the cart and go straight to checkout.
- Shoppers send a product to a friend by email.
- Shoppers enter a destination on the product page and see delivery options and costs.
- Shoppers move to the previous or next product in the same category.

**Benefit:** Faster, easier buying.

<!-- pagebreak -->

## 7.7 Cart and checkout

This part of the product takes shoppers from a filled cart to a confirmed order. It covers the cart, the checkout steps, final checks before an order is placed, delivery and pickup choices, addresses that work without street numbers, and legal notices for each country. Optional features add split checkout for several sellers, pickup codes, orders placed by agents at outlets, and business buying on account with company approvals.

### PRD-CHK-001 Shopping cart

| Key facts |  |
|---|---|
| Phase | Phase 1 |
| Pack | Always included |
| For | Business buyers and shoppers |
| Availability | Planned for phase 1 |

Shoppers add, change and remove items in a cart that is remembered between visits, see a mini cart and can save items for later.

**Who uses it:** Shoppers

**What it does**

- Shoppers add items, change quantities and remove items; totals update straight away.
- Shoppers see a mini cart with the number of items and the subtotal.
- Registered shoppers find the same cart when they sign in on another device.
- A guest's cart is kept when the guest signs in or registers.
- If the client enables it, shoppers move a cart item to a "saved for later" list and back.

**Rules**

- An item moved back from "saved for later" is checked again for stock and price.

**Benefit:** Shoppers collect several items, review them and buy in one go.

### PRD-CHK-002 Checkout

| Key facts |  |
|---|---|
| Phase | Phase 1 |
| Pack | Always included |
| For | Business buyers and shoppers |
| Availability | Planned for phase 1 |

The steps to complete a purchase: address, delivery, payment and review. Each client chooses whether guests can buy without an account or must sign in first.

**Who uses it:** Shoppers; client administrators

**What it does**

- Shoppers go through billing address, delivery address, delivery method, payment method and review steps, on one page or several, as the client chooses.
- The client decides whether guests may buy without an account (KTDA) or must sign in or register first (Malawi Post).
- Before paying, shoppers see every item with quantity and price, the subtotal, discounts, tax, payment fee, delivery or pickup fee and the total.
- Shoppers accept the terms of service before ordering, where the client requires it.
- Proposed: a registered shopper's default delivery address is filled in for them, to be confirmed.
- Proposed: on a multi-step checkout, shoppers see which step they are on and which details are missing, to be confirmed.

**Rules**

- Checkout is always secure, and prices and totals are always worked out again by the platform, so they cannot be changed from the shopper's browser.
- Where sign-in is required, no order or payment can be made by a guest.

**Benefit:** A clear, secure checkout means fewer abandoned purchases and correct totals.

### PRD-CHK-003 Final checks before ordering

| Key facts |  |
|---|---|
| Phase | Phase 1 |
| Pack | Always included |
| For | Business buyers and shoppers |
| Availability | Planned for phase 1 |

Just before an order is placed, the platform checks again stock, prices, whether the shopper may buy the items, whether the chosen payment method is valid, and any fraud warning signs.

**Who uses it:** Shoppers; client staff

**What it does**

- The order is refused if stock has run out since the item was added.
- Proposed: if a price has changed, the review page is shown again with the new total, to be confirmed.
- The order is refused if an item has been withdrawn or the shopper is no longer allowed to buy it.
- The order is refused if the payment method is no longer offered for this order.
- Orders that match a fraud rule are blocked or flagged for staff, as the client sets.
- The order is refused if the delivery address is no longer covered by the seller's delivery area.
- Checks from all other parts of the product, such as stock holds, quotas and discounts, run together at this point, so none is missed.

**Rules**

- Proposed: if a check cannot be completed because of an error, the item is refused rather than allowed, to be confirmed.
- No payment is started for an order that fails a check.

**Benefit:** Prevents orders for items that are gone, wrongly priced or not allowed.

### PRD-CHK-004 One checkout for several sellers

| Key facts |  |
|---|---|
| Phase | Phase 1 |
| Pack | Marketplace pack (optional) |
| For | Business buyers and shoppers |
| Availability | Depends on a pending decision: whether the workflow engine is built or an existing product is embedded (architecture decision) (ref WF-ENG); the payment model for paying sellers directly, and whether a payment-service or e-money licence is needed (Product Owner and legal advice) (ref PAY-DIRECT) |

When a cart holds items from several sellers, one checkout and one payment create a separate sub-order and task list for each seller.

**Who uses it:** Shoppers; sellers; finance staff

**What it does**

- Shoppers check out and pay once for items from many sellers.
- Each seller gets their own sub-order and task list, and an order notification for their part only.
- Sellers see only the sub-orders that contain their products.
- Proposed: delivery fees, payment fees, discounts and similar order-level amounts are shared out exactly between sub-orders, to be confirmed.
- A cart from a single seller creates a single order.

**Rules**

- Proposed: the payment is taken once for the whole checkout total, to be confirmed.
- Proposed: rounding differences go to the sub-order with the largest subtotal, so the parts always add up to the total, to be confirmed.
- Proposed: if no payment method can handle a multi-seller payment, shoppers are told before paying, to be confirmed.
- The shop keeps one cart for all sellers. The newer platform option of a separate cart for each seller, paid one seller at a time, stays switched off, because it would stop a mixed cart before it is split.

**Benefit:** Shoppers pay once while each seller handles their own part.

### PRD-CHK-005 Delivery or pickup for each item

| Key facts |  |
|---|---|
| Phase | Phase 1 |
| Pack | Postal and logistics pack (optional) |
| For | Business buyers and shoppers |
| Availability | Planned for phase 1 |

For each item in the order, the shopper chooses home delivery or pickup at an outlet.

**Who uses it:** Shoppers

**What it does**

- Shoppers choose delivery or pickup at a chosen outlet for each item.
- Delivery fees and pickup fees are worked out for each group of items.
- Outlets that do not serve an item, or are closed on the expected collection date, are not offered.
- Pickup-only items are offered for pickup only.
- Proposed: the shopper's preferred pickup point is chosen for them when it is open and serves the item, to be confirmed.
- Proposed: items are grouped into separate sub-orders by seller and by delivery or pickup choice, to be confirmed.

**Benefit:** Flexibility when items come from different places.

### PRD-CHK-006 Delivery time window and instructions

| Key facts |  |
|---|---|
| Phase | Phase 1 |
| Pack | Postal and logistics pack (optional) |
| For | Business buyers and shoppers |
| Availability | Planned for phase 1 |

Shoppers choose a preferred delivery time window, where the delivery service supports it, and add delivery instructions.

**Who uses it:** Shoppers; couriers; client administrators

**What it does**

- Administrators set delivery windows (day, start, end, number of places) for each delivery service and area.
- Shoppers pick a preferred delivery date from a list the platform offers as standard, then see the windows of that date that still have places and choose one.
- Where no windows are set for a service, checkout continues without this choice.
- Shoppers add delivery instructions, which are shown on the order.
- Proposed: when an order is cancelled, its window place is released, to be confirmed.

**Rules**

- Proposed: if the last place in a window is taken first by another order, the shopper is asked to choose another window, to be confirmed.
- Every change to delivery windows is recorded.
- When one checkout becomes several seller orders, each of them keeps the chosen delivery date.
- The client can switch off the choice of delivery date where it does not offer one.

**Benefit:** Fewer failed deliveries.

### PRD-CHK-007 Addresses without street numbers

| Key facts |  |
|---|---|
| Phase | Phase 1 |
| Pack | Always included |
| For | Business buyers and shoppers |
| Availability | Planned for phase 1 |

Address forms suit places without formal street addresses: landmarks, a map pin and a name for the address. A post-office box option, including a virtual post box, can be switched on by the client.

**Who uses it:** Shoppers; couriers; staff; sellers; client administrators

**What it does**

- Shoppers add a landmark and a name for the address; the client decides which are required.
- Proposed: shoppers place a pin on a map to mark their location, to be confirmed.
- The client switches on a post-office box option, including a virtual post box.
- County and region choices follow each country's setup.
- Proposed: staff, sellers and couriers see the pin with a map link and the landmark on the order, to be confirmed.

**Rules**

- Proposed: the client can require at least one way to find the address (street address, landmark or pin), to be confirmed.

**Benefit:** Couriers can find customers in areas with no street numbers.

### PRD-CHK-008 Reliable checkout on unreliable networks

| Key facts |  |
|---|---|
| Phase | Phase 1 |
| Pack | Always included |
| For | Business buyers and shoppers |
| Availability | Planned for phase 1 |

An order reference is created as soon as checkout starts and kept through payment and delivery. If payment is interrupted the shopper can resume, and pressing "pay" twice never creates two orders.

**Who uses it:** Shoppers; finance staff

**What it does**

- Proposed: shoppers receive one reference when checkout starts and see it on the order, invoice and tracking pages, to be confirmed.
- Shoppers whose payment was interrupted complete payment later from the order page.
- Proposed: shoppers who left checkout before ordering find their cart, addresses, delivery and payment choices kept, to be confirmed.
- Pressing "pay" twice creates only one order.
- A retried payment uses the same reference, so the payment provider recognises it.

**Rules**

- Proposed: until protection across several servers is delivered, the shop may go live only with checkout on a single server, to be confirmed.

**Benefit:** No lost or duplicate orders when networks are unreliable.

### PRD-CHK-009 Buyer protection and legal notices

| Key facts |  |
|---|---|
| Phase | Phase 1 |
| Pack | Always included |
| For | Business buyers and shoppers |
| Availability | Planned for phase 1 |

Checkout shows the confirmations and policy notices that e-commerce law requires, at the required points. Each country's rules are set up as configuration.

**Who uses it:** Clients; shoppers; client administrators

**What it does**

- Proposed: administrators set the notices each country requires at each checkout point, to be confirmed.
- Where an item or service needs it, shoppers read and tick a returns and refund policy before paying.
- Proposed: the platform records each shopper's acceptance with the policy version, to be confirmed.
- Proposed: the order confirmation is sent within the time limit the country sets, to be confirmed.
- The country's data-protection and e-commerce notices are shown at checkout.

**Rules**

- An order needing a policy acknowledgement cannot be placed until it is ticked.
- No acknowledgement is shown when no item needs one.

**Benefit:** Keeps online sales legal in each country.

### PRD-CHK-010 Minimum order and free delivery thresholds

| Key facts |  |
|---|---|
| Phase | Phase 1 |
| Pack | Always included |
| For | Business buyers and shoppers |
| Availability | Planned for phase 1 |

The client sets a minimum order value, and a value above which delivery or pickup is free.

**Who uses it:** Clients; shoppers

**What it does**

- The client sets a minimum order value; shoppers below it cannot complete checkout and see a message.
- The client sets a value above which delivery and pickup are free.
- Each shop can have its own values.

**Rules**

- One free threshold applies to both delivery and pickup.

**Benefit:** Avoids unprofitable small orders and encourages bigger baskets.

### PRD-CHK-011 Cart restriction rules

| Key facts |  |
|---|---|
| Phase | Phase 1 |
| Pack | Commerce extensions pack (optional) |
| For | Business buyers and shoppers |
| Availability | Planned for phase 1 |

Rules stop certain combinations of items, make some items pickup-only, limit where items can be delivered, or stop restricted accounts from buying.

**Who uses it:** Clients; client administrators; shoppers

**What it does**

- Administrators block items that must not be in the same cart; shoppers see the reason.
- Administrators make items pickup-only.
- Items that cannot be delivered to the shopper's area are flagged at the delivery step.
- Shoppers whose account has been restricted for suspected fraud cannot complete checkout.
- Proposed: every change to a rule is recorded with who, when and the old and new values, to be confirmed.

**Rules**

- A rule switched on after items were added still stops the order at checkout.

**Benefit:** Prevents orders that cannot or must not be fulfilled.

### PRD-CHK-012 Pickup code or QR code

| Key facts |  |
|---|---|
| Phase | Phase 1 |
| Pack | Postal and logistics pack (optional) |
| For | Business buyers and shoppers |
| Availability | Planned for phase 1 |

After ordering, the shopper receives a code or QR code to show when collecting the parcel.

**Who uses it:** Shoppers; outlet staff

**What it does**

- Shoppers choose an order code or a QR code, from the methods the client has enabled.
- The code is sent when the order is ready for pickup, by SMS or email as the client sets.
- Outlet staff enter or scan the code at collection, and it is checked before the parcel is handed over.

**Rules**

- Proposed: codes cannot be guessed, to be confirmed.
- Proposed: a code works only at the outlet chosen for the order, and only once, to be confirmed.
- Proposed: after a set number of wrong attempts, the code is blocked, to be confirmed.

**Benefit:** Only the right person collects the order.

### PRD-CHK-013 Orders placed by agents

| Key facts |  |
|---|---|
| Phase | Phase 1 |
| Pack | Assisted service pack (optional) |
| For | Business buyers and shoppers |
| Availability | Planned for phase 1 |

An agent at an outlet places an order for a customer and records how the customer paid.

**Who uses it:** Walk-in customers; agents; outlet supervisors

**What it does**

- Proposed: agents find or register a walk-in customer and place an order on their behalf, to be confirmed.
- Each order records the agent and the outlet that placed it.
- Agents see only the payment methods allowed for agent orders and record the payment taken.
- Supervisors list agent orders by agent, outlet and date; agents see only their own outlet.

**Rules**

- An agent must be assigned to an outlet before they can place orders for customers.

**Benefit:** Serves customers who cannot order online themselves, with every agent order traceable.

### PRD-CHK-014 Expected delivery date at checkout

| Key facts |  |
|---|---|
| Phase | Phase 1 |
| Pack | Postal and logistics pack (optional) |
| For | Business buyers and shoppers |
| Availability | Planned for phase 1 |

Checkout shows the expected delivery date, or when the order can be collected.

**Who uses it:** Shoppers

**What it does**

- Shoppers see the earliest and latest delivery date for each delivery option.
- Shoppers see, for each outlet, the date from which the order can be collected.
- Proposed: where no estimate is available, a simpler transit-time estimate is shown if one exists, otherwise no date, to be confirmed.
- Proposed: the estimate shown is kept with the order and shown again on the review step and in tracking, to be confirmed.

**Rules**

- Proposed: where shoppers can also choose a preferred delivery date, that list is shown as a choice and is not presented as the expected date, to be confirmed.

**Benefit:** Shoppers know when to expect their order.

### PRD-CHK-015 Extra details at checkout

| Key facts |  |
|---|---|
| Phase | Phase 1 |
| Pack | Always included |
| For | Business buyers and shoppers |
| Availability | Depends on a pending decision: confirmation by the client that this feature is needed in phase 1 (it was placed there by inference from the client documents) (ref PH-INF) |

Extra details can be asked for at checkout, such as a purchase-order number, special instructions or a gift message, optionally with a fee.

**Who uses it:** Shoppers; business buyers

**What it does**

- Business buyers enter their purchase-order number, which the client can make required.
- Shoppers add a gift message or special instructions.
- The client can charge a fee, with tax, for an option.
- An option can show or hide depending on another choice.

**Benefit:** Captures information business buyers and gift senders need.

### PRD-CHK-016 Business buying on account with credit limits

| Key facts |  |
|---|---|
| Phase | Phase 1 |
| Pack | Business trade pack (optional) |
| For | Business buyers |
| Availability | Depends on a pending decision: confirmation by the client that this feature is needed in phase 1 (it was placed there by inference from the client documents) (ref PH-INF); whether a licensed add-on is bought or the capability is built (technical and Product Owner decision) (ref PAID-STUB) |

Approved business customers buy now and pay later against an invoice, within a credit limit and agreed payment terms.

**Who uses it:** Business buyers; finance staff

**What it does**

- Finance staff approve a company's credit account and set the limit, currency and payment terms.
- Buyers of approved companies see "On account" as a payment method.
- Orders above the available credit cannot be paid on account.
- Proposed: when a credit account is suspended, "On account" is not offered, to be confirmed.
- Proposed: the client can stop buying on account while a company has overdue amounts, to be confirmed.

**Rules**

- Available credit is the limit less amounts owed and unpaid orders on account.
- Proposed: two orders from the same company at the same time cannot together exceed the limit, to be confirmed.
- Every change to a credit account is recorded.
- Standard reminder emails about unpaid orders follow the client's reminder setting, so buyers on account are not chased before their payment is due.

**Benefit:** Supports normal business-to-business trade on credit, with credit risk controlled.

### PRD-CHK-017 Quick and bulk ordering for businesses

| Key facts |  |
|---|---|
| Phase | Phase 1 |
| Pack | Business trade pack (optional) |
| For | Business buyers |
| Availability | Depends on a pending decision: confirmation by the client that this feature is needed in phase 1 (it was placed there by inference from the client documents) (ref PH-INF) |

Business buyers order quickly by typing product codes, uploading a spreadsheet or using saved order lists.

**Who uses it:** Business buyers

**What it does**

- Buyers type product codes and quantities; unknown codes are listed.
- Proposed: buyers upload a spreadsheet of codes and quantities and see which lines were added or refused, to be confirmed.
- Buyers add a whole saved order list to the cart.

**Rules**

- Every line is checked for stock and price as if added one by one.

**Benefit:** Large repeat orders take minutes, not hours.

### PRD-CHK-018 Company purchase approval

| Key facts |  |
|---|---|
| Phase | Phase 1 |
| Pack | Business trade pack (optional) |
| For | Business buyers |
| Availability | Depends on a pending decision: confirmation by the client that this feature is needed in phase 1 (it was placed there by inference from the client documents) (ref PH-INF); whether the workflow engine is built or an existing product is embedded (architecture decision) (ref WF-ENG) |

Orders by company staff above a set amount must be approved by someone else in the company before they are placed.

**Who uses it:** Business buyers; company approvers; company administrators

**What it does**

- Company administrators set approval limits for each company role.
- Buyers send orders above their limit to an approver.
- Approvers approve or reject; a rejection needs a reason, and the buyer is told.
- Once approved, the buyer places the order.

**Rules**

- The approver cannot be the person who asked for approval.
- Proposed: if the cart changes after approval, approval is needed again, to be confirmed.
- Changes to approval limits are recorded.

**Benefit:** Companies keep control of spending.

### PRD-CHK-019 Order confirmation

| Key facts |  |
|---|---|
| Phase | Phase 1 |
| Pack | Always included |
| For | Business buyers and shoppers |
| Availability | Planned for phase 1 |

After ordering, the shopper sees a confirmation page and receives a message with the order number.

**Who uses it:** Shoppers

**What it does**

- Shoppers see a confirmation page with the order number and the checkout reference.
- Shoppers receive a confirmation email with the order number, with the invoice attached if the client chooses.
- Proposed: for a checkout with several sellers, shoppers receive one confirmation listing all sub-orders, to be confirmed.

**Benefit:** Reassures shoppers that the order went through.

<!-- pagebreak -->

## 7.8 Payments, tax, settlement and reconciliation

This part of the product lets shoppers and buyers pay in the ways common in Kenya and Malawi: mobile money, cards, bank transfer and cash, with options for letters of credit, escrow, wallets and buying on account. It gives finance staff clear payment statuses, receipts, refunds, reconciliation with providers, tax calculation and fraud controls. Each payment provider and each tax authority's e-invoicing system is connected separately, so new providers can be added without changing the shop.

### PRD-PAY-001 Choosing which payment methods to offer

| Key facts |  |
|---|---|
| Phase | Phase 1 |
| Pack | Always included |
| For | Business buyers and shoppers |
| Availability | Planned for phase 1 |

The client switches payment methods on or off and decides where each is offered, for example by shop, country, customer type, rural or urban location, pickup or type of service.

**Who uses it:** Client administrators; shoppers

**What it does**

- Administrators switch each payment method on or off; past orders keep their payment records.
- Administrators limit a method by shop, country, customer type, rural or urban location, pickup or delivery, and type of service.
- Shoppers see the methods available to them, with name, logo and any fee.
- Clients with several card gateways can offer each one as a separate method under the same rules.
- Proposed: if no method is available, checkout stops with a message and support contact, and no order is placed, to be confirmed.

**Rules**

- Proposed: when several rules apply to one method, it is shown only if every rule allows it, to be confirmed.
- Proposed: rural or urban location is taken from the delivery area of the address or pickup point, to be confirmed.

**Benefit:** The right payment options appear for each situation.

### PRD-PAY-002 Card payments

| Key facts |  |
|---|---|
| Phase | Phase 1 |
| Pack | Always included |
| For | Business buyers and shoppers |
| Availability | Planned for phase 1 |

Shoppers pay by debit or credit card on the bank's secure payment page. Card details never reach the shop, and refunds go back to the card.

**Who uses it:** Shoppers; finance staff

**What it does**

- Shoppers are taken to the bank's secure page to enter card details.
- Successful payments mark the order as paid; failed or cancelled payments leave the order unpaid, and the shopper can retry.
- Where the gateway supports it, extra card security checks (3-D Secure) are used.
- Finance staff refund all or part of a card payment back to the same card.
- Each bank or gateway is connected separately, so a new gateway needs no change to checkout.

**Rules**

- The shop never receives or stores card details. The current platform version no longer stores card details at all.
- Any ready-made card gateway connector must be confirmed as available for the current platform version; otherwise it is built.

**Benefit:** Safe card payments that stay within card-security rules.

### PRD-PAY-003 PayPal

| Key facts |  |
|---|---|
| Phase | Phase 1 |
| Pack | Commerce extensions pack (optional) |
| For | Business buyers and shoppers |
| Availability | Depends on a pending decision: whether PayPal and global payment processors are acceptable under the rule that gateways are operated by a Central Bank of Kenya-regulated bank (KTDA to decide) (ref K-08) |

Shoppers can pay with PayPal.

**Who uses it:** International shoppers; finance staff

**What it does**

- Shoppers choose PayPal and pay with their PayPal account.
- Finance staff refund all or part of a PayPal payment.

**Benefit:** Convenient for international buyers.

### PRD-PAY-004 Mobile money

| Key facts |  |
|---|---|
| Phase | Phase 1 |
| Pack | Always included |
| For | Business buyers and shoppers |
| Availability | Planned for phase 1 |

Shoppers pay from their mobile-money wallet: a payment request appears on their phone and they confirm with their PIN. Each provider (M-Pesa, Mpamba, Airtel Money) connects separately.

**Who uses it:** Shoppers; finance staff

**What it does**

- Shoppers enter their mobile number and confirm the request on their phone with their PIN.
- Where the provider supports it, shoppers pay by scanning a QR code.
- The order is marked paid when the provider confirms success; if the payment fails, the shopper can retry within the time allowed.
- Proposed: if no answer arrives in time, the platform asks the provider for the status, to be confirmed.
- Reversals made by the provider are recorded against the order.
- Where the provider supports it, refunds go back to the shopper's wallet.
- New providers can be added without changing how mobile money works for shoppers.

**Rules**

- Proposed: a payment that succeeds after the order was cancelled for non-payment is flagged for finance staff, to be confirmed.

**Benefit:** Both clients require mobile money: KTDA names M-Pesa; Malawi Post names TNM Mpamba and Airtel Money.

### PRD-PAY-005 Bank transfer

| Key facts |  |
|---|---|
| Phase | Phase 1 |
| Pack | Always included |
| For | Business buyers and shoppers |
| Availability | Planned for phase 1 |

Buyers pay by bank transfer using a unique reference, and incoming payments are matched to orders.

**Who uses it:** Business buyers; finance staff

**What it does**

- Buyers receive a unique payment reference with the client's bank details on the confirmation page and email.
- Bank statement lines with a valid reference and the exact amount are matched and the order is marked paid.
- Payments with a different amount or an unknown reference go to a list for finance staff; the order is not marked paid.
- Proposed: banks can send payment notices directly to the platform for matching, to be confirmed.
- Proposed: each shop can show its own bank account, to be confirmed.

**Rules**

- Proposed: unpaid bank-transfer orders follow the client's reminder, flag or cancel rules (PRD-INV-004), to be confirmed.
- Proposed: the platform's standard reminder emails for unpaid orders are switched off, so buyers waiting for a bank transfer to arrive are not chased, to be confirmed.

**Benefit:** Suits large business payments, with orders released without manual searching.

### PRD-PAY-006 Letters of credit

| Key facts |  |
|---|---|
| Phase | Phase 1 |
| Pack | Business trade pack (optional) |
| For | Business buyers |
| Availability | Planned for phase 1 |

Buyers pay using a letter of credit from their bank. The client checks the letter of credit before shipping.

**Who uses it:** International buyers; export staff; finance staff; client administrators

**What it does**

- Business buyers choose letter of credit at payment; the order is created as unpaid with a letter-of-credit record.
- Finance staff record that the letter of credit is verified, which releases the order for shipping.
- Proposed: when a letter of credit is rejected or expires, the buyer and export staff are told, to be confirmed.
- Proposed: letters of credit and escrow are offered only to bulk buyers, to be confirmed.

**Rules**

- Goods cannot be shipped until the letter of credit is verified.
- What counts as a bulk buyer is not stated in the source and requires confirmation.

**Benefit:** A standard, secure way to pay for international trade.

### PRD-PAY-007 Escrow and staged release

| Key facts |  |
|---|---|
| Phase | Phase 1 |
| Pack | Business trade pack (optional) |
| For | Business buyers |
| Availability | Depends on a pending decision: the payment model for paying sellers directly, and whether a payment-service or e-money licence is needed (Product Owner and legal advice) (ref PAY-DIRECT) |

The buyer's money is held safely and released to the seller in stages, for example on dispatch, on delivery or when the buyer accepts the goods.

**Who uses it:** Business buyers; sellers; finance staff

**What it does**

- Bulk buyers pay into an escrow account held with a bank or payment provider.
- Money is released to the seller in stages when goods are dispatched, delivered or accepted.
- Proposed: no further release is made while a dispute is open, to be confirmed.
- Proposed: if a release fails, finance staff are alerted and can retry, to be confirmed.
- Proposed: buyers or finance staff can raise a payment dispute on an escrow order, to be confirmed.

**Rules**

- Every escrow action is recorded.

**Benefit:** Both sides are protected in large transactions.

### PRD-PAY-008 Cash on delivery and cash at an outlet

| Key facts |  |
|---|---|
| Phase | Phase 1 |
| Pack | Always included |
| For | Business buyers and shoppers |
| Availability | Planned for phase 1 |

Shoppers pay in cash on delivery or at an outlet, using a secure reference. Banker's cheques and payment slips paid to the client are also accepted and matched by staff.

**Who uses it:** Shoppers; outlet staff; couriers; finance staff; client administrators

**What it does**

- Shoppers choose cash on delivery where every item, seller and the delivery area allow it.
- Shoppers choose cash at an outlet and receive a secure payment reference.
- Outlet staff take the cash against the reference, mark the order paid and print a receipt.
- Proposed: couriers record the cash collected at delivery and the order is marked paid, to be confirmed.
- Finance staff record banker's cheques and payment slips against orders.
- Outlet cash payments are reconciled against closed shifts.

**Rules**

- The client decides which sellers, items and areas allow cash on delivery.
- Which local instruments are accepted is to be confirmed for each client.

**Benefit:** Serves customers without cards or mobile money.

### PRD-PAY-009 Wallet and store credit

| Key facts |  |
|---|---|
| Phase | Phase 1 |
| Pack | Engagement and loyalty pack (optional) |
| For | Business buyers and shoppers |
| Availability | Depends on a pending decision: whether postal operations, e-Government services and Malawi Post financial services are part of the product (Malawi Post to decide) (ref FG-06); the payment model for paying sellers directly, and whether a payment-service or e-money licence is needed (Product Owner and legal advice) (ref PAY-DIRECT); how a wallet balance is spent at checkout (Malawi Post and Product Owner) (ref WAL-01) |

Shoppers hold a balance in the shop, top it up and spend from it.

**Who uses it:** Shoppers; finance staff

**What it does**

- Shoppers top up their wallet with any active payment method; the balance rises only after the top-up succeeds.
- Shoppers pay for orders from their wallet.
- Shoppers see their balance and wallet history in their account.
- Refunds can be credited to the wallet when the shopper chooses.

**Rules**

- How a wallet is used when the balance is lower than the order total is still to be decided.

**Benefit:** Faster repeat payments and instant refunds.

### PRD-PAY-010 Split payments

| Key facts |  |
|---|---|
| Phase | Phase 1 |
| Pack | Marketplace pack (optional) |
| For | Business buyers and shoppers |
| Availability | Depends on a pending decision: the payment model for paying sellers directly, and whether a payment-service or e-money licence is needed (Product Owner and legal advice) (ref PAY-DIRECT) |

Each customer payment is automatically split into the seller's share, the delivery fee and the client's commission.

**Who uses it:** Sellers; finance staff

**What it does**

- Each paid order item is split into seller share, delivery fee and platform commission.
- Where the provider can split payments itself, the split is passed to it; otherwise it is used for seller payouts.
- On a partial refund, split amounts are reduced in proportion.
- Proposed: if no commission rule applies to an item, finance staff are alerted, to be confirmed.

**Rules**

- No split is made for orders paid directly to the seller (PRD-PAY-035); commission is invoiced instead.

**Benefit:** Everyone gets their correct share without manual calculation.

### PRD-PAY-011 Payment status

| Key facts |  |
|---|---|
| Phase | Phase 1 |
| Pack | Always included |
| For | Business buyers and shoppers |
| Availability | Planned for phase 1 |

Every payment has a clear status (started, pending, successful, failed, reversed) linked to its order. Shoppers see the status and can try again.

**Who uses it:** Shoppers; finance staff; support staff

**What it does**

- Every payment attempt is recorded with its status and linked to its order.
- Shoppers see the payment status and what to do next.
- Shoppers retry a failed or pending payment.
- Proposed: shoppers pay once for a checkout split into one order per seller, and every seller's order is marked paid, to be confirmed.

**Rules**

- Every status change is time-stamped and recorded.
- Proposed: retry is not offered once the order has been cancelled for non-payment, to be confirmed.
- An unpaid order is never cancelled while a payment for it has succeeded.
- Proposed: the platform's standard reminder emails and automatic cancelling of unpaid orders stay switched off unless the client asks for them, because orders paid on account, by letter of credit or by bank transfer are unpaid for a long time by design, to be confirmed.

**Benefit:** Fewer "did my payment go through?" calls.

### PRD-PAY-012 Charged only once

| Key facts |  |
|---|---|
| Phase | Phase 1 |
| Pack | Always included |
| For | Business buyers and shoppers |
| Availability | Planned for phase 1 |

If a shopper or the network retries a payment, the shopper is charged only once.

**Who uses it:** Shoppers

**What it does**

- A repeated payment request does not start a second charge.
- A repeated confirmation from a provider is recognised and ignored.
- Placing the same order twice in quick succession does not create a duplicate order.
- A retried checkout uses the same order reference with the provider.

**Benefit:** Prevents double charges.

### PRD-PAY-013 Payment receipts

| Key facts |  |
|---|---|
| Phase | Phase 1 |
| Pack | Always included |
| For | Business buyers and shoppers |
| Availability | Planned for phase 1 |

Payment receipts are sent by email and SMS.

**Who uses it:** Shoppers

**What it does**

- Shoppers receive a receipt when their payment succeeds, on the channels the client sets.
- Proposed: shoppers without a mobile number receive the receipt by email only, to be confirmed.

**Rules**

- Proposed: a failed SMS does not stop the email receipt, to be confirmed.
- The text-message service that comes with the platform (Twilio) must be confirmed for coverage, cost and data protection in Kenya and Malawi; a local text-message company can be connected instead.

**Benefit:** Customers have proof of payment.

### PRD-PAY-014 Payment reconciliation

| Key facts |  |
|---|---|
| Phase | Phase 1 |
| Pack | Always included |
| For | Staff (back office) |
| Availability | Planned for phase 1 |

The platform automatically matches the shop's payments against statements from payment providers and produces a daily file for finance.

**Who uses it:** Finance staff

**What it does**

- Provider statements are collected or uploaded and each line is classed as matched or unmatched.
- Finance staff work through unmatched items and resolve each one with a required note.
- A daily reconciliation file is produced for download.
- Proposed: where a provider has no direct link, finance staff upload its file and the same matching runs, to be confirmed.
- Amounts settled by providers are compared with seller settlement totals.

**Rules**

- Every resolution is recorded.

**Benefit:** Finance can trust the numbers and find gaps quickly.

### PRD-PAY-015 Payment fees

| Key facts |  |
|---|---|
| Phase | Phase 1 |
| Pack | Always included |
| For | Business buyers and shoppers |
| Availability | Planned for phase 1 |

The client adds a fee for particular payment methods and keeps dated versions of provider and platform fees.

**Who uses it:** Finance staff; shoppers

**What it does**

- Finance staff set a fixed or percentage fee for a payment method; shoppers see it before paying.
- Finance staff save new fee schedules with a start date; orders keep the fee that applied when placed.
- Cash on delivery fees can differ by rural or urban location and by service level, such as express or standard.
- Proposed: the fee charged on each item is kept with the schedule version, so refunds adjust it correctly, to be confirmed.

**Rules**

- Proposed: every change to a fee schedule is recorded with who, when and the old and new values, to be confirmed.

**Benefit:** Covers payment costs transparently.

### PRD-PAY-016 Refunds

| Key facts |  |
|---|---|
| Phase | Phase 1 |
| Pack | Always included |
| For | Business buyers and shoppers |
| Availability | Planned for phase 1 |

Full or partial refunds go back to the original payment method, with status tracking. Large refunds need approval, and fees are adjusted in proportion on partial refunds.

**Who uses it:** Shoppers; finance staff

**What it does**

- Finance staff refund all or part of an order to the original payment method.
- Proposed: where the method cannot refund, the refund is recorded as made outside the platform, or to the wallet if chosen, to be confirmed.
- On a partial refund, fees, commission and seller shares are adjusted in proportion.
- Shoppers see the refund status and the expected time for their payment method.
- Shoppers receive one refund notification when the refund completes.
- Refunds from returns and other order changes go through the same controlled process.

**Rules**

- Refunds above a set amount need approval, and the requester cannot approve their own refund.

**Benefit:** Customers get their money back properly and fraud is controlled.

### PRD-PAY-017 Chargebacks

| Key facts |  |
|---|---|
| Phase | Phase 1 |
| Pack | Always included |
| For | Business buyers and shoppers |
| Availability | Planned for phase 1 |

The platform tracks card payments that customers dispute with their bank (chargebacks).

**Who uses it:** Finance staff

**What it does**

- A chargeback case is opened, from the gateway or by staff, with reason, amount and response deadline.
- Proposed: finance staff are reminded before the response deadline, to be confirmed.
- Proposed: when a case is lost, the payment is shown as reversed and the order as refunded, to be confirmed.
- Proposed: when a case is won, the case is closed with no change to the payment, to be confirmed.

**Benefit:** Clients can respond in time and reduce losses.

### PRD-PAY-018 Fraud and risk controls

| Key facts |  |
|---|---|
| Phase | Phase 1 |
| Pack | Marketplace pack (optional) |
| For | Sellers and staff (back office) |
| Availability | Planned for phase 1 |

Checks that the client sets flag suspicious behaviour, such as many payments in a short time or many accounts on one device.

**Who uses it:** Fraud staff; client administrators

**What it does**

- Fraud staff set rules on how many payment attempts are allowed in a period; breaches are flagged or blocked.
- Accounts are flagged when too many use the same device.
- Fraud staff switch rules on or off and change limits; every change is recorded.
- Customers with an account restriction, or on a block list, cannot complete checkout.
- Proposed: a flagged order can be put on hold before shipping, to be confirmed.
- Proposed: a score from an optional fraud-scoring service can trigger a rule, to be confirmed.

**Rules**

- The message shown to a blocked customer does not give the reason.

**Benefit:** Reduces fraud losses.

### PRD-PAY-019 Payments operations screen

| Key facts |  |
|---|---|
| Phase | Phase 1 |
| Pack | Always included |
| For | Staff (back office) |
| Availability | Planned for phase 1 |

A screen for finance staff to see payment records and problem payments and to step in manually, with every action recorded.

**Who uses it:** Finance staff

**What it does**

- Finance staff search payments by date, method, status, order or provider reference.
- Finance staff see problem payments in one view.
- Finance staff check a status again, mark a payment paid with evidence, or cancel a payment attempt.

**Rules**

- A reason is required for every manual action, and only staff with permission can take one.

**Benefit:** Payment problems are fixed quickly and transparently.

### PRD-PAY-020 Tax calculation

| Key facts |  |
|---|---|
| Phase | Phase 1 |
| Pack | Always included |
| For | Business buyers and shoppers |
| Availability | Planned for phase 1 |

The platform calculates tax using tax categories and rates per country or region, and shows prices including or excluding tax as the client chooses.

**Who uses it:** Finance staff; shoppers

**What it does**

- Finance staff set tax categories and rates by country or region.
- Tax is calculated on each order item.
- Shoppers see items, taxes, payment fees and delivery fees before paying.

**Benefit:** Correct tax on every sale.

### PRD-PAY-021 Tax on fees and tax reports

| Key facts |  |
|---|---|
| Phase | Phase 1 |
| Pack | Always included |
| For | Business buyers and shoppers |
| Availability | Planned for phase 1 |

The platform calculates tax on the client's own commissions and fees, and produces tax reports and files for tax returns.

**Who uses it:** Finance staff; client administrators

**What it does**

- Tax on platform commission is calculated and kept with each seller share.
- Finance staff run tax reports by tax category, rate and type of transaction for a period, and export them.
- Administrators change commission, fee and tax rules with a start date, without developers.

**Rules**

- The old rule applies until a new rule's start date; every change is recorded.

**Benefit:** Supports the client's tax returns.

### PRD-PAY-022 Bulk payouts

| Key facts |  |
|---|---|
| Phase | Phase 3 |
| Pack | Agri-finance and schemes pack (optional) |
| For | Business buyers and shoppers |
| Availability | Planned for phase 3 |

The platform pays many recipients at once, for example farmers or beneficiaries, after approval, then tracks each payment.

**Who uses it:** Finance staff; programme staff

**What it does**

- Finance staff upload a list of recipients; invalid rows are reported and must be fixed first.
- A second authorised person approves the batch before money is sent.
- Each payment shows its status (succeeded, failed, reversed) with a reason.
- Payments that fail for temporary reasons are retried automatically.
- Proposed: where the bank offers it, account numbers and holder names are checked before payment, to be confirmed.

**Benefit:** Large payout runs become efficient and controlled.

### PRD-PAY-023 Paying in another currency

| Key facts |  |
|---|---|
| Phase | Phase 1 |
| Pack | Commerce extensions pack (optional) |
| For | Business buyers and shoppers |
| Availability | Depends on a pending decision: how a US dollar base currency works with M-Pesa settlement in Kenya shillings (KTDA to decide) (ref C-FX) |

The customer pays in their own currency while the client receives money in its base currency, with the exchange rate shown to the customer.

**Who uses it:** International buyers; finance staff

**What it does**

- Shoppers choose their currency and see prices and totals in it.
- Where the gateway supports it, the customer is charged in their own currency, with the rate and any conversion fee shown before paying.
- Proposed: where the gateway settles only in the base currency, the customer is charged in it and sees the converted amount first, to be confirmed.

**Rules**

- The currency rules for each client are still to be decided.

**Benefit:** Clear, fair cross-currency payments.

### PRD-PAY-024 Standard payment provider connection

| Key facts |  |
|---|---|
| Phase | Phase 1 |
| Pack | Always included |
| For | Business buyers and shoppers |
| Availability | Planned for phase 1 |

A standard way for every payment provider to connect to the platform: start a payment, receive the result, check status, reverse, refund, get the statement and pay out.

**Who uses it:** Platform team; client administrators

**What it does**

- Each provider connection states which actions it supports.
- Proposed: where a provider does not support an action, finance staff are offered a manual way instead, to be confirmed.
- Messages from providers are checked as genuine before any payment status changes.
- Administrators enter each provider's login details for their own installation.

**Rules**

- Provider login details are stored encrypted and are never copied into client setup packages.

**Benefit:** A new payment provider is added by building one connection, not by changing the shop.

### PRD-PAY-025 Electronic tax invoicing

| Key facts |  |
|---|---|
| Phase | Phase 1 |
| Pack | Always included |
| For | Business buyers and shoppers |
| Availability | Depends on a pending decision: confirmation by the client that this feature is needed in phase 1 (it was placed there by inference from the client documents) (ref PH-INF); whether statutory electronic invoicing (KRA eTIMS in Kenya, MRA EIS in Malawi) is required (both clients to confirm) (ref E-INV); which document and QR-code generation product is used (technical decision) (ref DOC-LIB) |

Each invoice is sent to the tax authority's electronic invoicing system, and the official fiscal number or QR code is printed on it. Credit notes are handled the same way, and each country connects separately.

**Who uses it:** Finance staff; shoppers; tax authorities

**What it does**

- Invoices are sent to the tax authority when issued.
- Failed sends are retried; persistent failures alert finance staff.
- Shoppers receive invoices that carry the official fiscal number or QR code.
- Credit notes for corrections and refunds are sent the same way.
- Tax on each fiscal invoice is the tax calculated for the order.

**Rules**

- Whether electronic invoicing applies to each client is to be confirmed.

**Benefit:** Kenya (KRA eTIMS) and Malawi (MRA EIS) operate electronic invoicing; the platform is ready once each client confirms how it applies.

### PRD-PAY-026 Kenya Revenue Authority eTIMS connection

| Key facts |  |
|---|---|
| Phase | Phase 1 |
| Pack | Kenya country pack |
| For | Business buyers and shoppers |
| Availability | Depends on a pending decision: confirmation by the client that this feature is needed in phase 1 (it was placed there by inference from the client documents) (ref PH-INF); whether statutory electronic invoicing (KRA eTIMS in Kenya, MRA EIS in Malawi) is required (both clients to confirm) (ref E-INV); which document and QR-code generation product is used (technical decision) (ref DOC-LIB) |

Connects invoices to the Kenya Revenue Authority's electronic invoicing system (eTIMS).

**Who uses it:** KTDA finance staff

**What it does**

- Invoices and credit notes are sent to KRA eTIMS using KTDA's own credentials.
- Sending, retries and printing of the fiscal number or QR code work as described for electronic tax invoicing (PRD-PAY-025).

**Rules**

- Expected to apply to KTDA; to be confirmed with KTDA, and the eTIMS specification is still to be received.

**Benefit:** Legal invoicing in Kenya, to be confirmed with KTDA.

### PRD-PAY-027 Malawi Revenue Authority EIS connection

| Key facts |  |
|---|---|
| Phase | Phase 1 |
| Pack | Malawi country pack |
| For | Business buyers and shoppers |
| Availability | Depends on a pending decision: confirmation by the client that this feature is needed in phase 1 (it was placed there by inference from the client documents) (ref PH-INF); whether statutory electronic invoicing (KRA eTIMS in Kenya, MRA EIS in Malawi) is required (both clients to confirm) (ref E-INV); which document and QR-code generation product is used (technical decision) (ref DOC-LIB) |

Connects invoices to the Malawi Revenue Authority's electronic invoicing system (EIS).

**Who uses it:** Malawi Post finance staff

**What it does**

- Invoices and credit notes are sent to MRA EIS using Malawi Post's own credentials.
- Sending, retries and printing of the fiscal number or QR code work as described for electronic tax invoicing (PRD-PAY-025).

**Rules**

- Expected to apply to Malawi Post; to be confirmed with Malawi Post, and the EIS specification is still to be received.

**Benefit:** Legal invoicing in Malawi, to be confirmed with Malawi Post.

### PRD-PAY-028 M-Pesa (Kenya)

| Key facts |  |
|---|---|
| Phase | Phase 1 |
| Pack | Kenya country pack |
| For | Business buyers and shoppers |
| Availability | Planned for phase 1 |

Connects the shop to Safaricom M-Pesa in Kenya: a payment request appears on the shopper's phone, with confirmations and reversals.

**Who uses it:** Kenyan shoppers; KTDA finance staff

**What it does**

- Shoppers pay with M-Pesa through a request on their phone.
- Confirmations, status checks and reversals work as for all mobile money (PRD-PAY-004).
- KTDA sets its own till or paybill number.

**Rules**

- The settlement currency for M-Pesa payments is still to be decided.

**Benefit:** Meets KTDA's requirement for M-Pesa payments.

### PRD-PAY-029 TNM Mpamba

| Key facts |  |
|---|---|
| Phase | Phase 1 |
| Pack | Malawi country pack |
| For | Business buyers and shoppers |
| Availability | Planned for phase 1 |

Connects the shop to TNM Mpamba mobile money in Malawi.

**Who uses it:** Malawian shoppers; Malawi Post finance staff

**What it does**

- Shoppers pay with TNM Mpamba from their wallet.
- Payments and refunds work as for all mobile money (PRD-PAY-004), over a secure connection.

**Benefit:** Meets Malawi Post's requirement for TNM Mpamba payments.

### PRD-PAY-030 Airtel Money

| Key facts |  |
|---|---|
| Phase | Phase 1 |
| Pack | Kenya and Malawi country packs |
| For | Business buyers and shoppers |
| Availability | Planned for phase 1 |

Connects the shop to Airtel Money in Malawi, and in Kenya if needed.

**Who uses it:** Shoppers; finance staff

**What it does**

- Shoppers pay with Airtel Money from their wallet.
- Payments and refunds work as for all mobile money (PRD-PAY-004), set up per country.

**Benefit:** Meets Malawi Post's requirement for Airtel Money, and can serve Kenya if a client asks.

### PRD-PAY-031 KTDA bank card gateway

| Key facts |  |
|---|---|
| Phase | Phase 1 |
| Pack | KTDA-specific connection |
| For | Business buyers and shoppers |
| Availability | Depends on a pending decision: the name of the KTDA bank (KTDA to provide) (ref KG-04) |

Connects card payments to the Central Bank of Kenya-regulated bank gateway that KTDA chooses.

**Who uses it:** KTDA; KTDA shoppers

**What it does**

- Shoppers pay by debit or credit card through the bank KTDA names, as described for card payments (PRD-PAY-002).
- Each card payment records the bank's reference.

**Rules**

- KTDA must name the bank gateway; the KTDA role that manages it is to be confirmed.

**Benefit:** Meets KTDA's requirement for a regulated bank gateway.

### PRD-PAY-032 Malawi Post card gateway

| Key facts |  |
|---|---|
| Phase | Phase 1 |
| Pack | Malawi Post-specific connection |
| For | Business buyers and shoppers |
| Availability | Depends on a pending decision: the name of the Malawi Post card payment provider (Malawi Post to provide) (ref MG-03) |

Connects card payments to the gateway Malawi Post chooses.

**Who uses it:** Malawi Post; Malawi Post shoppers

**What it does**

- Shoppers pay by card through the gateway Malawi Post names, as described for card payments (PRD-PAY-002).
- Card details never reach the shop; where cards are saved, only a secure stand-in from the gateway is kept.

**Rules**

- Malawi Post must name the gateway; the Malawi Post role that manages it is to be confirmed.

**Benefit:** Enables card payments for Malawi Post.

### PRD-PAY-033 Amounts owed by credit customers

| Key facts |  |
|---|---|
| Phase | Phase 1 |
| Pack | Business trade pack (optional) |
| For | Business buyers |
| Availability | Depends on a pending decision: whether a licensed add-on is bought or the capability is built (technical and Product Owner decision) (ref PAID-STUB) |

For customers who buy on credit: account statements, credit notes, matching payments to invoices and lists of overdue amounts by age.

**Who uses it:** Finance staff; business buyers

**What it does**

- Each invoice to a credit customer becomes an amount owed, with a due date from the agreed payment terms.
- Finance staff match payments received to one or more invoices; part-payments are allowed.
- Finance staff see overdue amounts grouped by age.
- Business buyers see their statement, open invoices and overdue amounts in their account.
- Proposed: where an invoice has been passed to a lender, the buyer is shown the lender as the party to pay, to be confirmed.

**Rules**

- The client sets the age groups.

**Benefit:** The client gets paid and tracks who owes what.

### PRD-PAY-034 Outlet receipts and end-of-shift cash-up

| Key facts |  |
|---|---|
| Phase | Phase 1 |
| Pack | Assisted service pack (optional) |
| For | Staff (back office) |
| Availability | Depends on a pending decision: confirmation by the client that this feature is needed in phase 1 (it was placed there by inference from the client documents) (ref PH-INF) |

Outlet counters print small (80 mm) receipts and pickup slips, and each outlet closes its cash at the end of a shift.

**Who uses it:** Outlet staff; walk-in customers; finance staff

**What it does**

- Proposed: outlet staff record how a walk-in customer paid and print an 80 mm receipt or pickup slip, to be confirmed.
- Staff close a shift by entering the cash counted; the expected and counted amounts and the difference are recorded.
- Proposed: shifts with a difference are flagged for finance review, to be confirmed.
- Cash payments from closed shifts appear in payment reconciliation.

**Rules**

- A closed shift cannot be changed.

**Benefit:** Supports counter service at post offices and outlets.

### PRD-PAY-035 Direct payment to the seller

| Key facts |  |
|---|---|
| Phase | Phase 2 |
| Pack | Marketplace pack (optional) |
| For | Business buyers and shoppers |
| Availability | Depends on a pending decision: acceptance by the Product Owner of features recommended without a client source (ref PO-REC-v8); the payment model for paying sellers directly, and whether a payment-service or e-money licence is needed (Product Owner and legal advice) (ref PAY-DIRECT) |

The buyer pays the seller directly into the seller's own payment account, such as an M-Pesa till or paybill, card merchant account or bank account, instead of paying the client first.

**Who uses it:** Sellers; shoppers; business buyers; client administrators

**What it does**

- Sellers connect their own payment account; the platform receives the payment result and records it against the order.
- The client decides which sellers or shops use direct payment; others use the normal flow.
- Sellers make refunds themselves, and the platform records them.
- A buyer who contests a refund can have a dispute case opened.

**Rules**

- Direct payment works only for orders from a single seller; these come from the checkout that splits a cart by seller, not from separate carts per seller.
- Split payments, escrow and seller payouts do not apply; commission is collected by invoicing the seller.

**Benefit:** Sellers keep full control of their own money, and the client runs a marketplace without holding sellers' funds.

### PRD-PAY-036 Confirming payments made outside the platform

| Key facts |  |
|---|---|
| Phase | Phase 2 |
| Pack | Marketplace pack (optional) |
| For | Business buyers and shoppers |
| Availability | Depends on a pending decision: whether the workflow engine is built or an existing product is embedded (architecture decision) (ref WF-ENG); acceptance by the Product Owner of features recommended without a client source (ref PO-REC-v8); the payment model for paying sellers directly, and whether a payment-service or e-money licence is needed (Product Owner and legal advice) (ref PAY-DIRECT) |

When a buyer pays a seller outside the platform (bank transfer, cash, cheque or letter of credit), the seller marks the order as paid and uploads proof, and the buyer confirms or contests it.

**Who uses it:** Sellers; business buyers

**What it does**

- Sellers mark an order as paid and upload proof of payment.
- Buyers confirm the payment, and the order is marked paid.
- Buyers contest the payment, which opens a dispute case.
- Proposed: uploaded proof files are checked before they are accepted, to be confirmed.

**Benefit:** The order record stays complete when buyers pay sellers outside the platform.

<!-- pagebreak -->

## 7.9 Orders, quotations and contracts

This part of the product lets client staff and sellers run every order after checkout: finding and managing orders, order stages, cancellations, holds, invoices and service levels. For business buyers it adds requests for quotation, negotiation, seller offers, request forms, and contracts from drafting to delivery. Optional features cover group buying, sample orders, repeat orders, bank guarantees and programme (scheme) applications.

### PRD-ORD-001 Order management console

| Key facts |  |
|---|---|
| Phase | Phase 1 |
| Pack | Always included |
| For | Staff (back office) |
| Availability | Planned for phase 1 |

One screen where staff find, view and manage every order, with its full history in one place.

**Who uses it:** Client order staff; authorised users who export orders

**What it does**

- Search orders by date, status, stage, payment, delivery, shop, seller, product, customer contact details and order number.
- Open one view of an order with its stages, notes, audit record, payments, shipments, holds and documents.
- Edit orders and add notes; every edit needs a reason.
- Print the invoice and the packing slips of an order.
- Export the selected orders to Excel or XML for offline analysis.
- See customers' current carts and wishlists to help customers who are stuck.
- See the stage and due time of each order so overdue orders can be handled first.

**Rules**

- Only users with export rights can export orders.

**Benefit:** Staff manage every order from one place.

### PRD-ORD-002 Configurable order stages

| Key facts |  |
|---|---|
| Phase | Phase 1 |
| Pack | Always included |
| For | Business buyers and shoppers |
| Availability | Planned for phase 1 |

The client defines its own order stages and which moves between stages are allowed.

**Who uses it:** Client administrators; client order staff; shoppers; business buyers

**What it does**

- Define the order stages and the allowed moves between them, without development work.
- Use a ready-made stage set, for example for Malawi Post: Created, Awaiting Payment, Paid, Processing, Shipped, Ready for Pickup, Delivered, Completed, Cancelled, Returned, Refunded.
- Move orders forward automatically when payment, dispatch, pickup readiness, delivery or refund happens.
- Show shoppers the current stage of their order and send a message when a visible stage changes.
- Decide when an order counts as confirmed: at placement, at payment, or after seller or staff acceptance.
- Let a business buyer confirm acceptance of a delivered order so the seller can be paid and the order closed (proposed, to be confirmed).

**Rules**

- Moves that are not allowed are blocked and recorded.
- Where an acceptance window is set, a delivered order with no response and no open dispute is treated as accepted when the window ends.
- An order cannot be accepted while a dispute on it is open.

**Benefit:** Order handling matches each client's real process.

### PRD-ORD-003 Order changes with reasons and audit

| Key facts |  |
|---|---|
| Phase | Phase 1 |
| Pack | Always included |
| For | Staff (back office) |
| Availability | Planned for phase 1 |

Every manual change to an order needs a reason, is approved where required and is recorded permanently.

**Who uses it:** Client order staff; client managers; auditors

**What it does**

- Require a reason, chosen from a client list, for every manual change to an order.
- Record every status change and key change (totals, items, addresses, delivery method) with before and after values.
- Hold sensitive changes, such as editing an order total, until a different authorised person approves them.
- Handle simultaneous actions on the same order safely, so no change is lost.
- Save a read-only copy of the order at key stages, for example when paid, completed or cancelled.

**Rules**

- The audit record cannot be edited or deleted.
- A deleted order note needs a reason, and its text is kept in the audit record.

**Benefit:** Full accountability for every order change.

### PRD-ORD-004 Cancellation rules

| Key facts |  |
|---|---|
| Phase | Phase 1 |
| Pack | Always included |
| For | Business buyers and shoppers |
| Availability | Planned for phase 1 |

Buyers and sellers cancel orders according to policy, giving a reason; orders are cancelled automatically if a seller misses its deadline.

**Who uses it:** Buyers; sellers; client administrators

**What it does**

- Buyers cancel an order before fulfilment starts, choosing a reason.
- Sellers reject an order they cannot fulfil, giving a reason, and the buyer is told.
- The platform cancels an order automatically when a seller does not accept it by the deadline.
- Apply a penalty to the seller for a missed deadline or a rejection, deducted at the next settlement.
- Start a refund automatically when a paid order is cancelled.

**Rules**

- Buyers can cancel only before the seller has packed or handed over the order and within the cancellation window set by the client.
- A seller rejection always needs a reason.
- An order on hold can still be cancelled.
- If a seller can supply only part of an order, the partial fulfilment process (PRD-ORD-006) applies instead.
- The platform can also cancel orders left unpaid after a set time; this standard option stays off unless the client asks for it, because unpaid orders are handled per payment method (PRD-INV-004).

**Benefit:** Fair, consistent cancellations for buyers and sellers.

### PRD-ORD-005 Seller order processing

| Key facts |  |
|---|---|
| Phase | Phase 1 |
| Pack | Marketplace pack (optional) |
| For | Sellers and staff (back office) |
| Availability | Planned for phase 1 |

Sellers accept, pack and hand over their orders for delivery from their own dashboard.

**Who uses it:** Sellers

**What it does**

- See a dashboard of own orders with the action due, stage, due time and any hold.
- Accept, mark as packed and hand over each order; each step is recorded.
- Receive messages for new orders, payment confirmation and approaching deadlines.
- Print pick lists and packing lists for several orders at once.

**Rules**

- A seller can accept an order once it is paid, or before payment for payment methods the client allows, for example cash on delivery.
- A seller acts only on own orders.
- An order on hold cannot be handed over.

**Benefit:** Sellers fulfil marketplace orders efficiently.

### PRD-ORD-006 Partial fulfilment approval

| Key facts |  |
|---|---|
| Phase | Phase 1 |
| Pack | Marketplace pack (optional) |
| For | Sellers and staff (back office) |
| Availability | Planned for phase 1 |

If only part of an order can be supplied, the buyer decides whether to accept the partial delivery.

**Who uses it:** Buyers; sellers

**What it does**

- Sellers report which items or quantities they cannot supply.
- The buyer is told which items are affected and the amount involved.
- The buyer accepts the reduced order, and the difference is refunded.
- The buyer rejects it, and the order is cancelled and refunded if paid.

**Rules**

- A paid order is never reduced without the buyer's acceptance.
- If the buyer does not answer in the time set by the client, the default action set by the client applies.
- Where the client turns this feature off, the seller either supplies the full order or rejects it.

**Benefit:** The buyer stays in control of what they receive and pay for.

### PRD-ORD-007 Order numbering

| Key facts |  |
|---|---|
| Phase | Phase 1 |
| Pack | Always included |
| For | Business buyers and shoppers |
| Availability | Planned for phase 1 |

The client chooses the order number format, for example MP-2026-000123.

**Who uses it:** Client administrators

**What it does**

- Set an order number format with prefix, year, month, day and running number.
- Pad the running number to a fixed length, for example 000123.
- Use a different format for each shop, for example to separate trade and retail orders.
- Use a different format for each order type: goods, service, quote or repeat order (proposed, to be confirmed).

**Rules**

- A format with an unknown element is refused when saved.

**Benefit:** Order numbers fit the client's records and reporting.

### PRD-ORD-008 Reorder

| Key facts |  |
|---|---|
| Phase | Phase 1 |
| Pack | Always included |
| For | Business buyers and shoppers |
| Availability | Planned for phase 1 |

Customers repeat a past order with one click; prices and stock are checked again.

**Who uses it:** Shoppers; business buyers

**What it does**

- Repeat a past order in one click; items go into the cart at current prices.
- Repeat only one seller part of an order that was split between sellers.
- See a warning for items that can no longer be added.

**Benefit:** Quick repeat buying.

### PRD-ORD-009 Invoices

| Key facts |  |
|---|---|
| Phase | Phase 1 |
| Pack | Always included |
| For | Business buyers and shoppers |
| Availability | Depends on a pending decision: which document and QR-code generation product is used (technical decision) (ref DOC-LIB) |

PDF invoices for each order and each seller, a combined receipt, and the company, tax and seller details.

**Who uses it:** Shoppers; finance staff

**What it does**

- Issue invoices automatically at the point the client chooses: order placed, paid or completed.
- Produce a separate invoice for each seller in a marketplace order.
- Produce one combined receipt listing every seller, amount and the total paid when a checkout is split.
- Show the company name, address and tax number, the seller name and tax number, platform fees and tax per rate.
- Attach the invoice to the order email.
- Print the official tax number and QR code on the invoice where the tax authority provides them.

**Rules**

- An invoice is not issued while a required company detail is missing; administrators are told, and issuing resumes once it is filled in.

**Benefit:** Proper invoices for customers and for accounting.

### PRD-ORD-010 Order holds

| Key facts |  |
|---|---|
| Phase | Phase 1 |
| Pack | Always included |
| For | Business buyers and shoppers |
| Availability | Planned for phase 1 |

Staff place an order on hold for fraud or compliance checks; it cannot be shipped until released.

**Who uses it:** Fraud and compliance staff; sellers

**What it does**

- Place an order on hold with a reason; the hold shows on the order and on the seller dashboard.
- Release the hold with a reason so fulfilment continues.
- Place a hold automatically when a payment risk rule says so (proposed, to be confirmed).
- Apply the same shipment checks to every client, with or without optional packs (proposed, to be confirmed).

**Rules**

- While a hold is active, no one can create a shipment, mark it shipped, ready for pickup or delivered, or hand it over.
- A hold does not block cancellation or payment.
- Placing and releasing holds is recorded.

**Benefit:** Stops suspicious orders being fulfilled.

### PRD-ORD-011 Cut-offs and service levels

| Key facts |  |
|---|---|
| Phase | Phase 1 |
| Pack | Always included |
| For | Business buyers and shoppers |
| Availability | Planned for phase 1 |

Daily order cut-off times and the promised handling time for each delivery service.

**Who uses it:** Client administrators; sellers; shoppers

**What it does**

- Set a daily cut-off time for each service level, using working days.
- Set the handling time for each service level, such as standard, express and pickup.
- Calculate and show the due time of each order to staff and sellers.
- Flag overdue orders and escalate them to the people set for that service level.
- Flag and escalate parcels not collected by the pickup deadline.
- Publish the service levels to sellers.

**Rules**

- An order placed after the cut-off starts its clock on the next working day.
- Missed seller deadlines lead to automatic cancellation and penalties (PRD-ORD-004).
- The escalation levels are proposed, to be confirmed.

**Benefit:** Clear promises and on-time fulfilment.

### PRD-ORD-012 Request for quotation

| Key facts |  |
|---|---|
| Phase | Phase 1 |
| Pack | Business trade pack (optional) |
| For | Business buyers |
| Availability | Planned for phase 1 |

A buyer asks for a price for listed or custom items; suitable sellers reply with structured quotes and terms.

**Who uses it:** Business buyers; shoppers; sellers

**What it does**

- Turn a cart into a price request with quantities, target prices and notes.
- Add custom items that are not listed, with a description, quantity, unit and attachment.
- Send the request to suitable sellers, who are notified; without the marketplace, the client prepares the quote.
- Sellers reply with prices per item, validity date, payment terms, delivery commitment, warranty and documents.
- Sellers ask the buyer questions; the answers are shared with all invited sellers.
- Ask for a quote from the page of a price-on-request product or service without adding it to the cart (proposed, to be confirmed).
- Link the request, the quote and the resulting order so the purchase can be traced.

**Rules**

- A seller sees only the requests it is invited to and its own quotes.
- The identity of the seller asking a question is not shown to other sellers.
- The client can add a check that a person, not a program, is sending the request (CAPTCHA) on the request page.

**Benefit:** Supports negotiated and bulk purchases.

### PRD-ORD-013 Quote negotiation and conversion

| Key facts |  |
|---|---|
| Phase | Phase 1 |
| Pack | Business trade pack (optional) |
| For | Business buyers |
| Availability | Planned for phase 1 |

The buyer compares quotes side by side, negotiates within limits and accepts one, which becomes an order.

**Who uses it:** Business buyers; sellers

**What it does**

- Compare all quotes for a request side by side, with the lowest total and differences highlighted.
- Make counter-offers on prices; the seller accepts, counters or declines.
- Accept one quote; its items go into the cart at the agreed prices and become an order.
- Notify the buyer and seller when quotes expire.

**Rules**

- The number of negotiation rounds and the total time are limited by client settings.
- Whether KTDA's 'buyer bids' are handled as counter-offers is to be confirmed.
- Accepting one quote declines the other quotes for the same request.
- Expired quotes cannot be accepted; the seller may issue a new quote.

**Benefit:** A structured negotiation instead of emails and phone calls.

### PRD-ORD-014 Seller offers

| Key facts |  |
|---|---|
| Phase | Phase 1 |
| Pack | Business trade pack (optional) |
| For | Business buyers |
| Availability | Depends on a pending decision: how KTDA's request to 'receive buyer bids' fits the decision to leave bidding and auctions out of the product (KTDA to decide) (ref K-01) |

The client or a seller posts an offer, for example a bulk lot of tea, and buyers respond to it. Scope is to be confirmed.

**Who uses it:** KTDA sales staff; sellers; business buyers

**What it does**

- Post an offer with lot or product, quantity, minimum order, indicative price or price on request, validity and terms.
- Review offers internally and publish them at a set date and time.
- Buyers respond with the quantity and price they want.
- Each response leads to a quote and an order, completing the purchase cycle.

**Rules**

- Responses are not ranked; there is no bidding or auction.
- The remaining quantity falls with each order; the offer closes at zero or when its validity ends.

**Benefit:** Sells large lots to interested buyers.

### PRD-ORD-015 Request forms with approval workflows

| Key facts |  |
|---|---|
| Phase | Phase 1 |
| Pack | Business trade pack (optional) |
| For | Business buyers |
| Availability | Depends on a pending decision: whether the workflow engine is built or an existing product is embedded (architecture decision) (ref WF-ENG) |

Online request forms for custom products or services that go through the client's internal approval steps.

**Who uses it:** Business buyers; KTDA staff; client administrators

**What it does**

- Request a custom tea blend, contract packaging or a forward contract through an online form.
- Move each request through the internal approval steps.
- Show the buyer the status of the request and the reason for any rejection.
- Create a draft contract when a forward-contract request is approved.
- Add new request types for each business model by configuration, without development work.

**Rules**

- A rejection needs a reason.

**Benefit:** Turns complex custom requests into a tracked process.

### PRD-ORD-016 Contract drafting

| Key facts |  |
|---|---|
| Phase | Phase 1 |
| Pack | Business trade pack (optional) |
| For | Business buyers |
| Availability | Depends on a pending decision: which document and QR-code generation product is used (technical decision) (ref DOC-LIB) |

Creates contracts from approved templates with the agreed terms, and sends them for internal review.

**Who uses it:** Legal and sales staff; client administrators; business buyers

**What it does**

- Draft a contract from a quote or request, with parties, value, scope, deliverables, schedule and terms filled in.
- Send the draft for internal review; the reviewer approves it or returns it with comments.
- Keep a library of approved templates for each transaction type, language and business model.
- Create a draft contract automatically from an approved forward-contract request.

**Rules**

- Terms agreed in the quote or request take priority over template defaults.
- Only approved contracts can be issued.

**Benefit:** Faster, consistent contracts.

### PRD-ORD-017 Contract e-signature

| Key facts |  |
|---|---|
| Phase | Phase 2 |
| Pack | Business trade pack (optional) |
| For | Business buyers |
| Availability | Depends on a pending decision: which document and QR-code generation product is used (technical decision) (ref DOC-LIB) |

All parties sign contracts electronically through a signing provider, with a record of who signed and when.

**Who uses it:** Business buyers; client staff; legal staff; auditors

**What it does**

- Send an approved contract for signing, one signer after another or all at once.
- Record each signer, the time and the signature check result returned by the provider.
- Require a minimum number of signers from one party, for example 3 of 5.

**Rules**

- A contract counts as signed only when every party's minimum number of signers is met.
- A decline by a signer stops the signing.
- The signing provider is not yet named.

**Benefit:** No printing or couriering of contracts.

### PRD-ORD-018 Contract amendments

| Key facts |  |
|---|---|
| Phase | Phase 2 |
| Pack | Business trade pack (optional) |
| For | Business buyers |
| Availability | Depends on a pending decision: whether the workflow engine is built or an existing product is embedded (architecture decision) (ref WF-ENG) |

Changes to a signed contract go through approval, with versions and a view of what changed.

**Who uses it:** Legal staff; client managers; auditors

**What it does**

- Propose a change to a signed contract; the other party accepts or rejects it.
- Create a new version for each accepted change, keeping all earlier versions.
- Send significant changes to value, scope or duration through an approval chain.
- Compare two versions side by side, showing added, deleted and changed text.

**Rules**

- A signed contract is never edited; it is only amended.
- Accepted changes are signed again.

**Benefit:** Contract changes stay controlled and traceable.

### PRD-ORD-019 Contract repository

| Key facts |  |
|---|---|
| Phase | Phase 2 |
| Pack | Business trade pack (optional) |
| For | Business buyers |
| Availability | Planned for phase 2 |

A searchable store of all contracts, with export.

**Who uses it:** Legal staff; auditors

**What it does**

- Search contracts by party, value, dates, terms text, status and type.
- Export a full contract package: the signed document, signature record, supporting documents and amendment history.

**Benefit:** Contracts are easy to find and audit.

### PRD-ORD-020 Award and acceptance letters

| Key facts |  |
|---|---|
| Phase | Phase 2 |
| Pack | Business trade pack (optional) |
| For | Business buyers |
| Availability | Depends on a pending decision: which document and QR-code generation product is used (technical decision) (ref DOC-LIB) |

Creates and sends award or acceptance letters and tracks whether they were accepted by the deadline.

**Who uses it:** Client staff; business buyers; client administrators

**What it does**

- Generate a branded letter with the required legal clauses when a quote is accepted or a request approved.
- Send the letter through the channels the client uses.
- Record when the recipient accepts the letter.
- Use letter templates for each transaction type, sector and language.

**Rules**

- A letter not accepted by its deadline lapses, and staff are told.

**Benefit:** Clear confirmation that a deal is agreed.

### PRD-ORD-021 Performance securities

| Key facts |  |
|---|---|
| Phase | Phase 3 |
| Pack | Business trade pack (optional) |
| For | Business buyers |
| Availability | Planned for phase 3 |

Records bank guarantees given by suppliers, tracks their validity, and releases or claims them.

**Who uses it:** Finance and legal staff

**What it does**

- Record a guarantee with bank, number, amount, currency and expiry date, linked to its contract.
- Alert finance staff before expiry and send a renewal request.
- Release the guarantee when the contract is completed.
- Claim the guarantee if the supplier fails, producing a letter to the bank.

**Rules**

- A claim needs approval and supporting documents.

**Benefit:** Protects the client if a supplier fails to deliver.

### PRD-ORD-022 Contract-to-order execution

| Key facts |  |
|---|---|
| Phase | Phase 1 |
| Pack | Business trade pack (optional) |
| For | Business buyers |
| Availability | Depends on a pending decision: how scheduled contract call-off orders are placed (technical decision) (ref CALLOFF-PLACE); which document and QR-code generation product is used (technical decision) (ref DOC-LIB) |

Turns a signed contract into scheduled orders, call-offs or milestone releases, and passes them to fulfilment.

**Who uses it:** Sales and logistics staff; business buyers

**What it does**

- Create orders automatically on the scheduled dates of a signed contract, at contract prices.
- Let buyers draw down against a framework contract.
- Release each phase of a multi-phase contract as a tracked order when its milestone is complete.
- Deliver forward contracts as agreed.
- Show the contract and business model on each resulting order.

**Rules**

- Draw-downs cannot exceed the remaining contract quantity.

**Benefit:** Contracts are carried out on time.

### PRD-ORD-023 Group buying

| Key facts |  |
|---|---|
| Phase | Phase 2 |
| Pack | Engagement and loyalty pack (optional) |
| For | Business buyers and shoppers |
| Availability | Planned for phase 2 |

Buyers join together in one deal; when a target quantity is reached, everyone gets the lower price.

**Who uses it:** Shoppers; small businesses; client administrators

**What it does**

- Staff set up a group deal with product, target quantity, group price and deadline.
- Buyers see the deal and the quantity pledged so far, and pledge a quantity.
- When the target is reached, participants are told and buy at the group price within a set window.
- When the deadline passes below target, the deal closes and participants are told.

**Rules**

- Pledging does not require payment (proposed, to be confirmed).
- No order is created for a deal that misses its target.

**Benefit:** Small buyers get bulk prices.

### PRD-ORD-024 Scheme applications

| Key facts |  |
|---|---|
| Phase | Phase 3 |
| Pack | Agri-finance and schemes pack (optional) |
| For | Citizens and businesses (government services) |
| Availability | Depends on a pending decision: whether the workflow engine is built or an existing product is embedded (architecture decision) (ref WF-ENG) |

People or businesses apply for a programme or scheme; eligibility is checked, and applications are reviewed and approved within a budget.

**Who uses it:** Beneficiaries; programme staff

**What it does**

- Apply for a programme with documents and declarations, and receive a reference.
- Check eligibility automatically, including against a programme register where one is set up.
- Send failing or flagged applications to staff for review with all documents.
- Approve applications within the budget and targeting rules, such as district, age or income band, and send the payment instruction.

**Rules**

- When the budget is used up, approval is blocked and the application waits for the next allocation.
- The programme register is not yet named.

**Benefit:** Supports government or development programmes delivered through the shop.

### PRD-ORD-025 Proforma invoice

| Key facts |  |
|---|---|
| Phase | Phase 1 |
| Pack | Business trade pack (optional) |
| For | Business buyers |
| Availability | Depends on a pending decision: confirmation by the client that this feature is needed in phase 1 (it was placed there by inference from the client documents) (ref PH-INF); which document and QR-code generation product is used (technical decision) (ref DOC-LIB) |

A preliminary invoice issued before payment, from a cart or quote, for opening a letter of credit or paying in advance.

**Who uses it:** International buyers; export staff

**What it does**

- Generate a numbered proforma invoice with date and validity from a cart or accepted quote.
- Link the proforma to the letter of credit record so the letter of credit matches the deal.

**Rules**

- An expired proforma cannot be used; prices are recalculated and a new proforma is needed.
- Where the client allows it, buyers can also download a standard quote document from their account; it is not a proforma invoice, so the proforma is still produced. Whether banks accept the quote document is to be confirmed.

**Benefit:** Gives buyers a formal priced document to open a letter of credit or pay in advance (inferred from KTDA's letter-of-credit requirement).

### PRD-ORD-026 Incoterms

| Key facts |  |
|---|---|
| Phase | Phase 1 |
| Pack | Business trade pack (optional) |
| For | Business buyers |
| Availability | Depends on a pending decision: confirmation by the client that this feature is needed in phase 1 (it was placed there by inference from the client documents) (ref PH-INF) |

Records the agreed international trade terms (Incoterms, such as FOB or CIF) on quotes and orders.

**Who uses it:** International buyers; export staff

**What it does**

- Choose an Incoterm and named place on a quote or at business checkout.
- Show the Incoterm on the quote, order, invoice and proforma.
- Drop the delivery fee and show buyer-arranged collection when the Incoterm puts transport on the buyer.

**Rules**

- The named place is required.
- The Incoterms edition is not yet stated.

**Benefit:** Avoids disputes in export deals.

### PRD-ORD-027 Sample orders

| Key facts |  |
|---|---|
| Phase | Phase 2 |
| Pack | Business trade pack (optional) |
| For | Business buyers |
| Availability | Planned for phase 2 |

Small sample quantities of bulk products that buyers can order, with limits per buyer.

**Who uses it:** Business buyers; client administrators

**What it does**

- Mark products as samples with their own price.
- Order samples like any other product.
- Limit the number of samples each buyer can order in a period.

**Rules**

- Samples beyond the limit are refused at the cart.

**Benefit:** Buyers can test quality before a large order.

### PRD-ORD-028 Recurring and subscription orders

| Key facts |  |
|---|---|
| Phase | Phase 2 |
| Pack | Engagement and loyalty pack (optional) |
| For | Business buyers and shoppers |
| Availability | Planned for phase 2 |

Customers set up orders that repeat automatically, for example every month.

**Who uses it:** Shoppers; business buyers; client staff

**What it does**

- Buy a product on a repeating cycle with a set number of repeats.
- Process each due repeat payment without manual action.
- Tell the buyer when a repeat payment fails, or cancel the arrangement where the client chooses.
- Remind the buyer by email a set number of days before the next payment is due; the client sets the number of days or switches it off.

**Rules**

- Only payment methods that support repeat payments are offered for repeating orders.
- Each cycle is processed only once.

**Benefit:** Convenience for regular purchases and steady sales.

<!-- pagebreak -->

## 7.10 Shipping, delivery and fulfilment

This part of the product decides how each order reaches the customer: delivery options and fees, pickup points, delivery areas and expected delivery dates. It runs the warehouse and postal work behind each parcel, from picking and labelling to sorting, last-mile delivery and proof of delivery. It connects to courier companies and international postal systems, and handles failed deliveries, cash on delivery and international parcels.

### PRD-LOG-001 Shipping methods and rates

| Key facts |  |
|---|---|
| Phase | Phase 1 |
| Pack | Always included |
| For | Business buyers and shoppers |
| Availability | Planned for phase 1 |

Delivery options by country with prices by weight or order value, free delivery above a threshold, and expected delivery ranges.

**Who uses it:** Shoppers; client administrators

**What it does**

- Set up several delivery options, such as standard, express and pickup, each with its price rule and delivery time.
- Show shoppers the options allowed for their country, with name, description, price and expected delivery range.
- Recalculate the delivery charge when the cart weight or value changes.
- Offer free delivery above an order value the client chooses.
- Keep the chosen option, price and promised delivery range with the order.

**Rules**

- Where no delivery option is available for the address, checkout stops and pickup points are offered if any exist.

**Benefit:** Customers see delivery cost and timing clearly.

### PRD-LOG-002 Delivery fee rules

| Key facts |  |
|---|---|
| Phase | Phase 1 |
| Pack | Always included |
| For | Business buyers and shoppers |
| Availability | Planned for phase 1 |

Calculates delivery fees from distance or zone, weight, service speed, rural or urban location and pickup versus delivery, and shows the breakdown.

**Who uses it:** Shoppers; client administrators; logistics staff

**What it does**

- Define fees that follow the client's price lists: base fee by service and zone, weight bands, distance bands and rural or urban charges.
- Show shoppers how the fee is made up before they pay.
- Set pickup fees per outlet and delivery fees separately.
- Keep dated versions of the fee lists so past orders keep the fee that applied.
- Recalculate the fee when the address, cart weight or service changes.
- Record the share of each delivery fee owed to the delivery partner that carries the parcel.

**Rules**

- Where distance cannot be measured, the zone price applies; if there is none, the option is not offered.
- A new fee list applies only from its effective date.
- Changes to fee lists are recorded.

**Benefit:** Fair, accurate delivery pricing.

### PRD-LOG-003 Pickup points and outlets

| Key facts |  |
|---|---|
| Phase | Phase 1 |
| Pack | Always included |
| For | Business buyers and shoppers |
| Availability | Planned for phase 1 |

A list of pickup points and outlets with opening hours, fee, capacity, temporary closures and a map.

**Who uses it:** Shoppers; logistics staff; client administrators

**What it does**

- Choose a pickup point or outlet from a list or map, with address, opening hours and fee.
- Maintain outlets with address, opening hours, fee and map position.
- Mark an outlet as temporarily closed for a period or as full.
- Link each outlet to the warehouse that supplies it.
- Mark outlets that accept returns.
- List orders already placed for an outlet whose status changes, for follow-up.

**Rules**

- Outlets that are closed on the expected arrival date, or full, are not offered.
- An outlet removed in the Malawi Post source system is closed, not deleted.
- Outlet status changes are recorded.

**Benefit:** Customers choose a convenient collection point.

### PRD-LOG-004 Delivery coverage rules

| Key facts |  |
|---|---|
| Phase | Phase 1 |
| Pack | Always included |
| For | Business buyers and shoppers |
| Availability | Planned for phase 1 |

Rules for where delivery is available, by location or outlet, and which areas each seller covers.

**Who uses it:** Shoppers; sellers; client administrators; logistics staff

**What it does**

- Define coverage areas by country, region, district and postcode, with the services and outlets for each, and whether the area is rural or urban.
- Let sellers set the districts they deliver to.
- Show shoppers only the delivery and pickup options available for their location.
- Limit some products to certain services or outlets.

**Rules**

- Where neither delivery nor pickup is available, no order can be placed.
- Items from a seller who does not cover the buyer's area cannot be delivered, and the buyer is told which items.
- Coverage is checked again just before the order is placed.

**Benefit:** Customers are not offered delivery that cannot happen.

### PRD-LOG-005 Expected delivery dates

| Key facts |  |
|---|---|
| Phase | Phase 1 |
| Pack | Always included |
| For | Business buyers and shoppers |
| Availability | Planned for phase 1 |

Calculates the expected delivery or collection date from service standards, cut-off times and transport links.

**Who uses it:** Shoppers; client administrators

**What it does**

- Set delivery standards per route and service: transit days and the days transport departs.
- Show the earliest and latest delivery date at checkout, on the order and on the tracking page.
- Keep the promised range with each order for measuring on-time delivery.
- Prepare delivery windows by product and district in advance so they can be shown quickly.

**Rules**

- Orders before the daily cut-off on a working day are dispatched the same day; otherwise the next working day.
- Where transport departs only on certain days, dispatch moves to the next departure day.
- Non-working days are skipped.

**Benefit:** Realistic delivery promises.

### PRD-LOG-006 DHL connection

| Key facts |  |
|---|---|
| Phase | Phase 1 |
| Pack | Courier connection (reusable) |
| For | Business buyers and shoppers |
| Availability | Planned for phase 1 |

Connects to DHL for delivery prices, booking, labels and tracking.

**Who uses it:** Logistics staff; shoppers

**What it does**

- Get DHL prices using KTDA's DHL account, and offer DHL at checkout if enabled.
- Book DHL shipments; the DHL waybill number becomes the tracking number.
- Print the DHL label.
- Show DHL tracking updates on the parcel timeline.

**Rules**

- Any step the DHL connection cannot perform is done manually or through the standard courier connection.

**Benefit:** Lets KTDA ship with DHL, one of the couriers it names, from the platform.

### PRD-LOG-007 Shipping labels and barcodes

| Key facts |  |
|---|---|
| Phase | Phase 1 |
| Pack | Always included |
| For | Business buyers and shoppers |
| Availability | Planned for phase 1 |

Prints shipping labels with barcodes that postal and courier scanners can read.

**Who uses it:** Warehouse staff; sellers

**What it does**

- Print a label with sender, recipient, weight, service, shipment number and a barcode of the tracking number.
- Use the courier's own label when the parcel is booked with a courier.
- Assign an international postal tracking number first for international postal parcels.
- Print the digital postcode or address alias on the label where one exists.
- Print on network label printers, for example Zebra, or produce a PDF.
- Let sellers print packing slips and labels for their own orders.
- Print return labels with the same layout and barcode rules.

**Rules**

- Labels are tested with the client's postal scanners during acceptance testing.

**Benefit:** Parcels can be scanned and tracked at every step.

### PRD-LOG-008 Fulfilment allocation and routing

| Key facts |  |
|---|---|
| Phase | Phase 1 |
| Pack | Always included |
| For | Staff (back office) |
| Availability | Planned for phase 1 |

Decides who fulfils each order line (the seller, the client or a logistics company) and from which warehouse, choosing the nearest.

**Who uses it:** Logistics staff

**What it does**

- Send each order line to the party that fulfils it, according to the fulfilment model.
- Route client-fulfilled lines to the nearest warehouse that has the stock.
- Split a line across warehouses where no single warehouse has enough, or flag it for manual allocation.
- Change an allocation with a reason (proposed, to be confirmed).
- Run the steps of a KTDA fulfilment workflow with the same rules.

**Rules**

- Allocation happens when the order is paid, or when it is placed for cash on delivery and on-account orders.
- Sellers who opt in to client fulfilment are fulfilled by the client unless the product says otherwise.
- Allocation changes are recorded.

**Benefit:** Faster, cheaper delivery.

### PRD-LOG-009 Warehouse pick, pack and dispatch

| Key facts |  |
|---|---|
| Phase | Phase 1 |
| Pack | Always included |
| For | Staff (back office) |
| Availability | Planned for phase 1 |

Picking lists, packing checks, dispatch confirmation and manifests for the warehouse, with a shelf location for each product.

**Who uses it:** Warehouse staff; logistics staff; sellers

**What it does**

- Print pick lists showing each product's shelf location (zone, aisle, rack, shelf, bin) in walking order.
- Check each packed item against the order before sealing.
- Move packed parcels to a staging area and confirm dispatch with the carrier and waybill number.
- Print or export a daily dispatch manifest per transport operator.
- Let sellers print one combined pick list and packing list for several orders.
- Run the shipping steps in the same configured order every time.

**Rules**

- A parcel can be confirmed as packed only when every item and quantity matches the order.
- Steps cannot be skipped.
- Products without a shelf location are listed last and marked as missing.
- For pickup orders, staff confirm arrival at the outlet instead of dispatch.

**Benefit:** Organised, accurate dispatch.

### PRD-LOG-010 Shipments

| Key facts |  |
|---|---|
| Phase | Phase 1 |
| Pack | Always included |
| For | Business buyers and shoppers |
| Availability | Planned for phase 1 |

One order can ship in several parcels, each with a tracking number, status and packing slip.

**Who uses it:** Shoppers; logistics staff; warehouse staff

**What it does**

- Ship one order in several parcels.
- Show the shopper each parcel with its tracking number and status: shipped, ready for pickup or delivered.
- Print a packing slip for each parcel.

**Rules**

- Changing a shipped, ready-for-pickup or delivered date needs a reason and is recorded.

**Benefit:** Customers can follow each part of their order.

### PRD-LOG-011 Postal work tasks and seller collections

| Key facts |  |
|---|---|
| Phase | Phase 1 |
| Pack | Postal and logistics pack (optional) |
| For | Staff (back office) |
| Availability | Depends on a pending decision: whether postal operations, e-Government services and Malawi Post financial services are part of the product (Malawi Post to decide) (ref FG-06) |

Creates delivery work tasks (collect, sort, dispatch, deliver) from online orders and lets Malawi Post schedule collections from sellers.

**Who uses it:** Malawi Post operations staff

**What it does**

- Create collect, sort, dispatch and deliver tasks from online orders that go through the postal network.
- Mark each task complete when the matching scan is recorded, and make the next task due.
- Schedule a collection from a seller with a date and time window.
- Record the parcels collected, or a missed visit with a reason, and reschedule.
- Create onward tasks for returned parcels handed in at the wrong outlet.
- Show each parcel as awaiting pickup, sorting, dispatch or out for delivery.

**Benefit:** Connects online orders to postal operations.

### PRD-LOG-012 Proof of delivery record

| Key facts |  |
|---|---|
| Phase | Phase 1 |
| Pack | Always included |
| For | Business buyers and shoppers |
| Availability | Planned for phase 1 |

Stores proof that an order was delivered or collected, such as courier confirmation, a one-time code or a QR code checked at the pickup counter.

**Who uses it:** Support staff; outlet staff; client administrators; shoppers

**What it does**

- Store proof of delivery with method, time, location where given, recipient name and the courier or collector.
- Choose which proof methods (signature, one-time code, QR scan) each service requires.
- Check the buyer's pickup code or QR at the counter before handing over the parcel.
- Use the proof as evidence in disputes.

**Rules**

- An order cannot be marked delivered without the proof its service requires.
- After a set number of wrong codes, code entry is locked.
- Only authorised staff see signatures, photos and locations; others see the method and time.
- Changes to proof requirements are recorded and apply to new shipments.

**Benefit:** Settles 'I never received it' disputes.

### PRD-LOG-013 Delivery problems

| Key facts |  |
|---|---|
| Phase | Phase 1 |
| Pack | Always included |
| For | Business buyers and shoppers |
| Availability | Planned for phase 1 |

Handles failed deliveries: redelivery, address corrections, return to sender, incident reports and escalation.

**Who uses it:** Logistics staff; shoppers

**What it does**

- Record each failed delivery with a reason, such as unreachable, not at home or address issue, and a next action.
- Let shoppers choose a new delivery date or correct their address from the message or the order page.
- Return a parcel to the sender.
- Report incidents such as a lost, damaged or delayed parcel, with evidence.
- Escalate problems that stay open too long to the right contact.
- Record the final outcome: redelivered, returned, lost or damaged.

**Rules**

- After the maximum number of failed attempts, no further redelivery is offered and the parcel returns to sender.
- A corrected address is checked for coverage and fee, and the change is recorded.

**Benefit:** Problem deliveries are resolved, not forgotten.

### PRD-LOG-014 Cash on delivery reconciliation

| Key facts |  |
|---|---|
| Phase | Phase 1 |
| Pack | Postal and logistics pack (optional) |
| For | Staff (back office) |
| Availability | Planned for phase 1 |

Matches cash collected by couriers to the orders and delivery runs it belongs to.

**Who uses it:** Finance staff; cashiers

**What it does**

- Add each cash-on-delivery amount to the courier's expected cash for that delivery run.
- Record the cash handed over at the depot and compare it with the amount expected.
- Alert finance staff to differences and resolve them with a note.
- Match delivery partner cash reports to parcels by tracking number and list unmatched lines.

**Rules**

- Where delivery runs are not used, a run is the courier and delivery date (proposed, to be confirmed).
- Resolved differences are locked and recorded.

**Benefit:** Cash is accounted for and losses are spotted.

### PRD-LOG-015 Address checking and map location

| Key facts |  |
|---|---|
| Phase | Phase 1 |
| Pack | Always included |
| For | Business buyers and shoppers |
| Availability | Planned for phase 1 |

Checks addresses and places them on the map, including digital postcodes where available.

**Who uses it:** Shoppers; couriers; client administrators

**What it does**

- Check an address when it is entered and suggest a correction the shopper can accept or ignore.
- Store the map position of each delivery address, from a map pin or the checking service.
- Use the country's digital postcode or address alias system if one is adopted, and show it on labels and tracking.

**Rules**

- If the checking service is unavailable, the address is saved and the order goes ahead; the address is marked as not checked.

**Benefit:** Fewer delivery failures.

### PRD-LOG-016 Cross-border shipping

| Key facts |  |
|---|---|
| Phase | Phase 1 |
| Pack | Postal and logistics pack (optional) |
| For | Business buyers and shoppers |
| Availability | Planned for phase 1 |

Handles international postal shipping: customs declarations, international tracking and duties, using the postal systems CDS and IPS, and the UPU Global Monitoring System (GMS).

**Who uses it:** Malawi Post operations staff; international shoppers

**What it does**

- Draft customs declarations from the order and send them to customs through UPU CDS.
- Show international tracking from IPS on the shopper's tracking page.
- Exchange data with the UPU Global Monitoring System to monitor international service quality.
- Show duties where the data is available.

**Rules**

- A parcel cannot be dispatched until its customs declaration is accepted.

**Benefit:** International parcels can clear customs and be tracked across postal networks.

### PRD-LOG-017 Storage charges and changes before dispatch

| Key facts |  |
|---|---|
| Phase | Phase 1 |
| Pack | Postal and logistics pack (optional) |
| For | Business buyers and shoppers |
| Availability | Planned for phase 1 |

Lets customers change the address before dispatch, and charges a daily storage fee after a number of free days at the outlet.

**Who uses it:** Shoppers; outlet staff; client administrators

**What it does**

- Let shoppers change the delivery address or instructions before dispatch.
- Set the number of free storage days at an outlet and the daily charge after that.
- Show the shopper the amount due on the order page.
- Let staff record the charge as paid or waive it with a reason.
- Set the pickup deadline; uncollected parcels are flagged and the shopper is told.

**Rules**

- Address changes are allowed only before dispatch and within the window the client sets.
- A change that gives a different delivery fee is refused (proposed, to be confirmed).
- A parcel with a charge is handed over only once the charge is paid or waived.

**Benefit:** Encourages timely collection and covers storage costs.

### PRD-LOG-018 Delivery performance indicators

| Key facts |  |
|---|---|
| Phase | Phase 1 |
| Pack | Postal and logistics pack (optional) |
| For | Staff (back office) |
| Availability | Depends on a pending decision: whether a licensed add-on is bought or the capability is built (technical and Product Owner decision) (ref PAID-STUB) |

Dashboards for on-time delivery, delivery success rate and transit times.

**Who uses it:** Logistics managers

**What it does**

- See the on-time delivery rate against the promised delivery range.
- See the delivery success rate, counting delivered, returned and lost parcels.
- See the average transit time in days.

**Rules**

- Only authorised users can open the dashboard.

**Benefit:** Shows how well delivery is performing.

### PRD-LOG-019 Cold-chain and hazardous goods

| Key facts |  |
|---|---|
| Phase | Phase 3 |
| Pack | Warehouse pack (optional) |
| For | Business buyers and shoppers |
| Availability | Planned for phase 3 |

Special handling for goods that must stay cold, with temperature monitoring, and for hazardous goods, with certified carriers and required documents.

**Who uses it:** Logistics staff

**What it does**

- Flag products that must stay cold.
- Receive temperature readings during the journey and raise an incident when they go out of range.
- Flag hazardous products.

**Rules**

- Cold goods go only with carriers able to carry them cold.
- Hazardous goods go only with carriers certified for that class, and only once the required documents are attached.

**Benefit:** Safe delivery of sensitive goods.

### PRD-LOG-020 International postal tracking numbers (S10)

| Key facts |  |
|---|---|
| Phase | Phase 1 |
| Pack | Postal and logistics pack (optional) |
| For | Business buyers and shoppers |
| Availability | Planned for phase 1 |

Creates and checks international postal tracking numbers in the UPU S10 format, for example RR123456789MW.

**Who uses it:** Malawi Post operations staff; support staff

**What it does**

- Issue S10 numbers from Malawi Post's allocated range.
- Check entered or received S10 numbers for format and check digit.
- Find any parcel and its order items from any of its reference numbers.

**Rules**

- When a range is used up, no number is issued and staff are told to set up a new range.
- Invalid numbers are refused.

**Benefit:** Required for international postal tracking.

### PRD-LOG-021 Standard courier connection

| Key facts |  |
|---|---|
| Phase | Phase 1 |
| Pack | Always included |
| For | Business buyers and shoppers |
| Availability | Planned for phase 1 |

One standard way to connect delivery companies for price, booking, label, tracking and cancellation, plus rules to choose the best carrier.

**Who uses it:** Platform team; logistics staff; shoppers

**What it does**

- Add a new courier by building one connection, not by changing the shop.
- Offer a manual path, such as entering a waybill or uploading a label, for steps a courier does not support.
- Assign each shipment to a delivery partner by rules for area, service, weight, seller and fulfilment model.
- Compare courier prices and choose the cheapest that meets the service.
- Receive courier tracking updates as they happen, or check for them at set intervals.
- Book return collections with couriers that support them.

**Rules**

- Staff can reassign a partner with a reason; any booking with the old partner is cancelled first.
- A booking retried after a delay never creates a second booking.
- Updates from couriers are checked for authenticity before use.

**Benefit:** A new courier is added by building one connection, not by changing the shop.

### PRD-LOG-022 Post-office drop-off acceptance

| Key facts |  |
|---|---|
| Phase | Phase 1 |
| Pack | Postal and logistics pack (optional) |
| For | Staff (back office) |
| Availability | Depends on a pending decision: whether postal operations, e-Government services and Malawi Post financial services are part of the product (Malawi Post to decide) (ref FG-06) |

Post offices and agencies accept parcels dropped off by sellers, scanning them in.

**Who uses it:** Sellers; post-office staff

**What it does**

- Show sellers the parcels to drop off and the outlets that accept them.
- Scan a dropped-off parcel to accept it, recording outlet, staff and time.
- Record the weight at acceptance and flag differences from the declared weight.

**Rules**

- Parcels the platform does not expect are refused.

**Benefit:** Sellers hand over parcels at any post office.

### PRD-LOG-023 Hub-and-spoke sorting

| Key facts |  |
|---|---|
| Phase | Phase 1 |
| Pack | Postal and logistics pack (optional) |
| For | Staff (back office) |
| Availability | Depends on a pending decision: whether postal operations, e-Government services and Malawi Post financial services are part of the product (Malawi Post to decide) (ref FG-06) |

Parcels are sorted at central hubs and sent out to branches, with a scan at every handover.

**Who uses it:** Malawi Post operations staff

**What it does**

- Record every hand-over scan at a hub or branch on the parcel timeline.
- Set the expected sequence of hubs on each route.
- Flag parcels that miss an expected scan for review.

**Rules**

- Scans that name an unknown hub go to review.
- The postal sorting system is not yet named.

**Benefit:** Parcels can be traced through the postal network.

### PRD-LOG-024 Last-mile delivery lists and attempts

| Key facts |  |
|---|---|
| Phase | Phase 1 |
| Pack | Postal and logistics pack (optional) |
| For | Staff (back office) |
| Availability | Depends on a pending decision: whether postal operations, e-Government services and Malawi Post financial services are part of the product (Malawi Post to decide) (ref FG-06) |

Daily delivery lists for drivers and couriers, where they record each delivery attempt.

**Who uses it:** Couriers; Malawi Post operations staff

**What it does**

- Create the day's delivery list for each courier in a planned order.
- Mark parcels as out for delivery when the round starts, which notifies the shopper.
- Record each attempt as delivered, with proof, or failed, with a reason.

**Rules**

- A failed attempt opens a delivery problem case (PRD-LOG-013).
- Couriers see only their own lists.

**Benefit:** Organised last-mile delivery.

### PRD-LOG-025 FedEx connection

| Key facts |  |
|---|---|
| Phase | Phase 1 |
| Pack | Courier connection (reusable) |
| For | Business buyers and shoppers |
| Availability | Planned for phase 1 |

Connects to FedEx for delivery services, as far as FedEx's system allows, including tracking updates.

**Who uses it:** Logistics staff

**What it does**

- Use the FedEx services its system supports, with KTDA's account.
- Show FedEx tracking updates on the parcel timeline.
- Record the waybill and hand-over manually where FedEx offers no tracking connection.

**Rules**

- Where no tracking connection exists, the parcel is marked "carrier updates not available".

**Benefit:** Access to another international courier.

### PRD-LOG-026 G4S connection

| Key facts |  |
|---|---|
| Phase | Phase 1 |
| Pack | Courier connection (reusable; Kenya) |
| For | Business buyers and shoppers |
| Availability | Planned for phase 1 |

Connects to G4S courier services in Kenya, including tracking updates.

**Who uses it:** KTDA logistics staff

**What it does**

- Use the G4S (Kenya) services its system supports, with KTDA's account.
- Show G4S tracking updates on the parcel timeline.
- Record the waybill and hand-over manually where G4S offers no tracking connection.

**Rules**

- Where no tracking connection exists, the parcel is marked "carrier updates not available".

**Benefit:** A local courier option for KTDA.

### PRD-LOG-027 Skynet connection

| Key facts |  |
|---|---|
| Phase | Phase 1 |
| Pack | Courier connection (reusable; Kenya) |
| For | Business buyers and shoppers |
| Availability | Planned for phase 1 |

Connects to Skynet courier services, including tracking updates.

**Who uses it:** KTDA logistics staff

**What it does**

- Use the Skynet services its system supports, with KTDA's account.
- Show Skynet tracking updates on the parcel timeline.
- Record the waybill and hand-over manually where Skynet offers no tracking connection.

**Rules**

- Where no tracking connection exists, the parcel is marked "carrier updates not available".

**Benefit:** A courier option named by KTDA.

### PRD-LOG-028 Wells Fargo (Kenya) connection

| Key facts |  |
|---|---|
| Phase | Phase 1 |
| Pack | Courier connection (reusable; Kenya) |
| For | Business buyers and shoppers |
| Availability | Planned for phase 1 |

Connects to Wells Fargo courier services in Kenya, including tracking updates.

**Who uses it:** KTDA logistics staff

**What it does**

- Use the Wells Fargo (Kenya) services its system supports, with KTDA's account.
- Show Wells Fargo tracking updates on the parcel timeline.
- Record the waybill and hand-over manually where Wells Fargo offers no tracking connection.

**Rules**

- Where no tracking connection exists, the parcel is marked "carrier updates not available".

**Benefit:** A local courier option named by KTDA.

### PRD-LOG-029 Aramex connection

| Key facts |  |
|---|---|
| Phase | Phase 1 |
| Pack | Courier connection (reusable) |
| For | Business buyers and shoppers |
| Availability | Planned for phase 1 |

Connects to Aramex courier services, including tracking updates.

**Who uses it:** KTDA logistics staff

**What it does**

- Use the Aramex services its system supports, with KTDA's account.
- Show Aramex tracking updates on the parcel timeline.
- Record the waybill and hand-over manually where Aramex offers no tracking connection.

**Rules**

- Where no tracking connection exists, the parcel is marked "carrier updates not available".

**Benefit:** A regional and international courier named by KTDA.

### PRD-LOG-030 Shipping lines and agents connection

| Key facts |  |
|---|---|
| Phase | Phase 1 |
| Pack | Courier connection (reusable; Kenya) |
| For | Business buyers and shoppers |
| Availability | Planned for phase 1 |

Connects to shipping lines and shipping agents for sea freight, including tracking updates.

**Who uses it:** KTDA export staff

**What it does**

- Use the services each shipping line supports, such as booking references and container or bill-of-lading tracking.
- Show sea-freight milestones on the shipment timeline.
- Enter milestones manually where a shipping line offers no connection.

**Benefit:** Supports export of bulk tea by sea.

### PRD-LOG-031 Malawi Post delivery partner connections

| Key facts |  |
|---|---|
| Phase | Phase 1 |
| Pack | Malawi Post-specific connection |
| For | Business buyers and shoppers |
| Availability | Planned for phase 1 |

Connects to Malawi Post's delivery partners once Malawi Post names them.

**Who uses it:** Malawi Post operations staff

**What it does**

- Assign shipments to a named partner under the assignment rules.
- Use the services each partner supports.
- Give partners without a connection a printable job list and record their hand-overs and deliveries manually.

**Rules**

- The partners are not yet named.

**Benefit:** Lets partners carry Malawi Post deliveries.

### PRD-LOG-032 Own-fleet proof of delivery

| Key facts |  |
|---|---|
| Phase | Phase 1 |
| Pack | Postal and logistics pack (optional) |
| For | Staff (back office) |
| Availability | Depends on a pending decision: whether postal operations, e-Government services and Malawi Post financial services are part of the product (Malawi Post to decide) (ref FG-06); whether a licensed add-on is bought or the capability is built (technical and Product Owner decision) (ref PAID-STUB) |

Malawi Post's own delivery staff capture the customer's signature, a photo and the GPS location on a phone app as proof of delivery.

**Who uses it:** Malawi Post couriers

**What it does**

- Capture time, location, recipient name and acknowledgement (signature, one-time code, QR or scan) with photos at delivery.
- Keep working without signal; the original capture time is kept when the phone syncs.
- Add further evidence to a parcel already delivered.

**Rules**

- Only registered phones of authorised couriers can send proof.
- Location is captured with the consent recorded by the app.

**Benefit:** Strong proof of delivery for the operator's own fleet.

<!-- pagebreak -->

## 7.11 Tracking and customer messages

This part of the product shows shoppers, guests, sellers and staff where each parcel is. It gathers tracking updates from the client's own scanners, courier companies and international postal systems into one timeline, and flags parcels that missed an expected scan. It also sends every customer message, by email, SMS, app notification, WhatsApp or in-app notice, following each customer's choices, and records whether each message arrived.

### PRD-TRK-001 Shipment tracking for buyers

| Key facts |  |
|---|---|
| Phase | Phase 1 |
| Pack | Always included |
| For | Business buyers and shoppers |
| Availability | Planned for phase 1 |

Customers enter an order or tracking number and see a timeline of where the parcel has been, can share a tracking link and refresh it.

**Who uses it:** Shoppers; parcel recipients

**What it does**

- Track a parcel by tracking number, including international postal and waybill numbers.
- See a timeline of each step with date, time and place, newest first, and the expected delivery range.
- See all own orders in one place with the latest status and expected delivery of each.
- Share a tracking link with the recipient without showing account details.
- Have the page refresh by itself, or refresh it on request.
- Revoke a shared link at any time.

**Rules**

- The public tracking page never shows the customer name, address, phone or email.
- Shared links expire after a period the client sets.
- Repeated lookups from one location must pass a check that a person, not a machine, is asking (proposed, to be confirmed).

**Benefit:** Customers know where their order is without calling support.

### PRD-TRK-002 Tracking update hub

| Key facts |  |
|---|---|
| Phase | Phase 1 |
| Pack | Always included |
| For | Staff (back office) |
| Availability | Planned for phase 1 |

Collects tracking updates from the client's own scanners, courier companies and international postal systems into one place, using one common list of step names, and flags parcels that missed an expected scan.

**Who uses it:** Logistics staff; client administrators; shoppers

**What it does**

- Collect updates from scanners, couriers, postal systems, PostGlobal and manual entry into one timeline.
- Translate each source's own codes into one common list of step names.
- Set rules for the scan expected next and the time allowed; open an alert when it does not arrive.
- Escalate alerts that stay open too long as delivery problems.
- Place updates that cannot be matched in a review list, and reprocess them once fixed.
- Search any order or parcel by order number, tracking number or customer phone and see its full history.
- Keep and archive tracking history according to retention rules.
- Show updates for return parcels on the return timeline.

**Rules**

- Duplicate updates are ignored.
- Updates arriving out of order are shown in time order, and a parcel status never moves backwards.
- Unmatched updates never send a customer message.
- Changes to code translations are recorded and apply to later updates.

**Benefit:** One reliable tracking picture whatever carrier moves the parcel.

### PRD-TRK-003 Scanning app for mobile staff

| Key facts |  |
|---|---|
| Phase | Phase 1 |
| Pack | Postal and logistics pack (optional) |
| For | Staff (back office) |
| Availability | Depends on a pending decision: whether postal operations, e-Government services and Malawi Post financial services are part of the product (Malawi Post to decide) (ref FG-06) |

A mobile app for staff at collection points, hubs and on delivery rounds to scan parcels. It records who scanned on which device, works without signal, and adds location, photos, voice notes and video as evidence.

**Who uses it:** Malawi Post staff at collection points, hubs and on delivery rounds; logistics staff

**What it does**

- Scan parcels at collection, hub arrival and departure, and delivery; each scan appears on the timeline.
- Record the staff member and device for every scan.
- Keep scanning without signal; scans keep their original time when the phone syncs.
- Add location, photos, voice notes and video as evidence.
- Give each staff member their own delivery or collection list (proposed, to be confirmed).

**Rules**

- Only registered devices linked to a staff member can send scans.
- Scans synced very late are accepted but marked late.
- Location is captured with the consent recorded by the app.
- Only authorised staff can view scan photos and recordings.

**Benefit:** Every handover of a parcel is recorded.

### PRD-TRK-004 Email notifications and templates

| Key facts |  |
|---|---|
| Phase | Phase 1 |
| Pack | Always included |
| For | Business buyers and shoppers |
| Availability | Planned for phase 1 |

Automatic emails sent when something happens to an order, such as placed or shipped, using templates that fill in details such as name and order number, in each language and shop.

**Who uses it:** Shoppers; client administrators

**What it does**

- Send emails automatically when an order is placed, shipped and at other steps.
- Fill in details such as name, order number, outlet opening hours, pickup code and expected delivery range.
- Use the customer's language and a separate version for each shop.
- Let staff change subject, wording, timing and attachments without developers.
- Detect bounced emails, flag the address and use another channel instead.

**Rules**

- The bounce flag clears when the customer changes or confirms their email.
- Template changes are recorded.

**Benefit:** Customers are kept informed automatically.

### PRD-TRK-005 Multi-channel messaging

| Key facts |  |
|---|---|
| Phase | Phase 1 |
| Pack | Always included |
| For | Business buyers and shoppers |
| Availability | Planned for phase 1 |

The central messaging service: a message is written once and sent by SMS, email, app notification or WhatsApp in the right language, with a backup channel if the first fails.

**Who uses it:** Shoppers; client staff; client administrators

**What it does**

- Write one message for each occasion and send it by every channel the client uses.
- Send messages in the customer's language.
- Use a backup channel when the first one fails or the customer has no phone or email.
- Send an order confirmation and a message when the order status changes.
- Switch channels on or off for each client, and set content for each occasion and channel.
- Send SMS to customers who registered with a mobile number and no email.

**Rules**

- Where no translation exists in the customer's language, the client's default language is used (proposed, to be confirmed).
- Disabled channels are skipped and the skip is recorded.

**Benefit:** Consistent messages on every channel without building each one separately.

### PRD-TRK-006 Message preferences

| Key facts |  |
|---|---|
| Phase | Phase 1 |
| Pack | Always included |
| For | Business buyers and shoppers |
| Availability | Planned for phase 1 |

Customers choose which messages they want and on which channels, set quiet hours and limits, and follow or stop updates for a single order.

**Who uses it:** Shoppers; client administrators

**What it does**

- Choose, in My account, which kinds of message to receive on which channel.
- Set quiet hours; non-urgent messages wait until they end.
- Subscribe to or unsubscribe from updates for a single order, including by a one-click link in each message.
- Set default quiet hours and a limit on how many messages a customer receives.
- Stop SMS by texting the opt-out keyword, including for phone numbers without an account.
- Opt in before receiving WhatsApp, Telegram, push or voice messages.

**Rules**

- Messages the client marks as mandatory are always sent on their main channel.
- Urgent messages are sent at once, even in quiet hours.
- Customers who have not set their own values follow the client defaults.
- Preference changes are recorded.

**Benefit:** Customers get useful messages, not spam.

### PRD-TRK-007 Message delivery records

| Key facts |  |
|---|---|
| Phase | Phase 1 |
| Pack | Always included |
| For | Staff (back office) |
| Availability | Planned for phase 1 |

Records whether each message was sent, delivered or failed on each channel, linked to the order or shipment.

**Who uses it:** Support staff; client administrators

**What it does**

- Keep a record of each message with channel, recipient, order, shipment, status and times.
- Update the record when the provider confirms delivery or failure, and start the backup channel on failure.
- Show every message for an order and its shipments on the order page.
- Report sent, delivered, failed, held and suppressed messages by channel and type, with export.
- Keep proof of delivery for each person when one notice goes to many people.

**Rules**

- Records are deleted after the retention period the client sets.

**Benefit:** Proves customers were notified, and failed messages can be fixed.

### PRD-TRK-008 In-app notification list

| Key facts |  |
|---|---|
| Phase | Phase 2 |
| Pack | Always included |
| For | Business buyers and shoppers |
| Availability | Planned for phase 2 |

A bell icon in the customer's account showing their recent notifications.

**Who uses it:** Shoppers

**What it does**

- See the number of unread notifications on every page.
- Open a list of notifications, newest first, with a link to the order or parcel.
- Mark a notification as read by opening it, or clear it.

**Benefit:** Customers can see past messages in one place.

### PRD-TRK-009 Service notices and disruption banners

| Key facts |  |
|---|---|
| Phase | Phase 1 |
| Pack | Postal and logistics pack (optional) |
| For | Business buyers and shoppers |
| Availability | Planned for phase 1 |

Sends messages to chosen groups of customers, for example everyone affected by a delay, and shows a banner when a service is disrupted.

**Who uses it:** Support staff; shoppers

**What it does**

- Choose affected customers by parcel status, outlet, area, carrier, order status or dates, and preview the number and a sample.
- Send the notice now or schedule it; customers receive it in their language.
- Cancel a scheduled notice before it goes.
- Show a banner on the site and tracking pages for a set period.
- Show a banner automatically when a tracking source stops sending updates.

**Rules**

- Customers' message preferences apply to service notices.

**Benefit:** Customers hear about problems before they complain.

### PRD-TRK-010 Shipment view for sellers

| Key facts |  |
|---|---|
| Phase | Phase 1 |
| Pack | Marketplace pack (optional) |
| For | Sellers and staff (back office) |
| Availability | Planned for phase 1 |

Sellers see when their parcels were handed over and delivered.

**Who uses it:** Sellers

**What it does**

- See own shipments with shipped, ready-for-pickup and delivered dates.
- See the full tracking timeline of own shipments, including collection, drop-off and delivery.

**Rules**

- Sellers cannot see other sellers' shipments.

**Benefit:** Sellers can answer their own customers' questions.

### PRD-TRK-011 Order status check for guests

| Key facts |  |
|---|---|
| Phase | Phase 1 |
| Pack | Always included |
| For | Individual shoppers |
| Availability | Planned for phase 1 |

Anyone can check an order's status with the order number and their phone number or email, without logging in.

**Who uses it:** Guest shoppers

**What it does**

- Enter the order number and the phone number or email used on the order.
- See the order status, its parcels and the tracking timeline.

**Rules**

- Only a partly hidden contact detail is shown; no other personal details.
- A failed check does not say which detail was wrong.
- After repeated failed checks from one location, a check that a person, not a machine, is asking is required.

**Benefit:** Easy tracking for guest buyers.

### PRD-TRK-012 Delivery and pickup messages

| Key facts |  |
|---|---|
| Phase | Phase 1 |
| Pack | Always included |
| For | Business buyers and shoppers |
| Availability | Planned for phase 1 |

Automatic messages when a parcel is on its way, ready for pickup, when a delivery attempt failed, and reminders before the pickup deadline.

**Who uses it:** Shoppers; Malawi Post outlet and operations staff

**What it does**

- Tell the shopper when the parcel is shipped, with the tracking number and link.
- Tell the shopper when the parcel is out for delivery, with the delivery code where the service needs one.
- Tell the shopper when the parcel is delivered or collected.
- Tell the shopper when the parcel is ready for pickup: outlet, address, opening hours, pickup code, identification to bring and the deadline.
- Tell the shopper when a delivery attempt failed, why, and how to reschedule.
- Remind the shopper before the pickup deadline, and tell the shopper and the outlet when a parcel is still uncollected.

**Rules**

- Each message is sent only once per parcel and step.

**Benefit:** Fewer missed deliveries and uncollected parcels.

<!-- pagebreak -->

## 7.12 Returns, refunds and disputes

This part of the product lets shoppers return items, report problems and get refunds under clear, published rules. Staff and sellers inspect returns, decide outcomes on evidence and handle disputes through a case file with time limits and escalation. For Malawi Post, unresolved cases follow its complaints and dispute policy.

### PRD-RET-001 Return requests

| Key facts |  |
|---|---|
| Phase | Phase 1 |
| Pack | Always included |
| For | Business buyers and shoppers |
| Availability | Planned for phase 1 |

Customers ask to return an item within the allowed time, choose a reason and what they want, attach photos and follow the status; the returns policy is shown.

**Who uses it:** Shoppers; client administrators; support staff

**What it does**

- Request a return of items from a completed order, choosing a quantity, a reason and the outcome wanted (refund, replacement or another option the client sets).
- Describe the problem and attach photos.
- Follow the status of each return in My account, including approval and return tracking.
- Read the returns policy on the return form.
- Set the return window and the lists of reasons and outcomes, shown in the shopper's language.

**Rules**

- Returns can be requested only within the return window the client sets, and only for completed orders.
- Digital products that are downloaded cannot be returned unless the client allows it.
- File size and number of photos are limited.
- Only the shopper and authorised staff can open the photos.
- The shopper and the client are notified of each new return request.

**Benefit:** A clear, fair returns process.

### PRD-RET-002 Return eligibility rules

| Key facts |  |
|---|---|
| Phase | Phase 1 |
| Pack | Always included |
| For | Business buyers and shoppers |
| Availability | Planned for phase 1 |

Rules for which items can be returned, and within which window and conditions, by category, seller policy and product.

**Who uses it:** Client administrators; sellers; shoppers

**What it does**

- Mark categories or products as not returnable.
- Give each seller its own return window, counted from the order date or the delivery date.
- Show conditions for an item, such as its required state, which the shopper must confirm.
- Offer shoppers only the items they are allowed to return.

**Rules**

- A product marked not returnable is never returnable; after that, product, seller, category and general rules apply in that order.
- A request that includes an ineligible item or too many items is refused as a whole.
- Rule changes are recorded.

**Benefit:** Returns follow policy automatically.

### PRD-RET-003 Return delivery

| Key facts |  |
|---|---|
| Phase | Phase 1 |
| Pack | Always included |
| For | Business buyers and shoppers |
| Availability | Depends on a pending decision: content that Malawi Post has not yet provided (service lists, return shipping models, priority e-Government services and the complaints and dispute policy) (ref T-MISS) |

How returned items travel back: return labels or instructions, collection from the customer or drop-off, and routing back to the right place.

**Who uses it:** Shoppers; logistics staff; client administrators

**What it does**

- Choose collection from the shopper's address in a time slot, or drop-off at an outlet that accepts returns.
- Download a return label, or read instructions where no label is needed.
- Create a return collection or drop-off task with a tracking number automatically when a return is approved.
- Follow the return parcel; the return is marked received when it arrives.
- Set who pays for return delivery: the seller, the customer, shared, or the client, and when each applies.
- Send each returned item to the seller, warehouse or outlet that should receive it (proposed, to be confirmed).

**Rules**

- Malawi Post's rules for who pays are to be confirmed.
- Items dropped at the wrong outlet are sent onward.

**Benefit:** Returns arrive back where they should.

### PRD-RET-004 Return inspection

| Key facts |  |
|---|---|
| Phase | Phase 1 |
| Pack | Always included |
| For | Business buyers and shoppers |
| Availability | Planned for phase 1 |

Staff inspect returned items at the outlet or warehouse, record the condition with photos and decide the outcome.

**Who uses it:** Warehouse and outlet staff; sellers

**What it does**

- Record the location, condition grade, photos, notes and accepted quantity.
- Accept the return, accept part of it or reject it.
- Put accepted items back into stock.
- Start the refund for the accepted quantity.
- Let sellers inspect returns of their own products where the client allows it.

**Rules**

- An item can be inspected only after it has been received.
- A rejected shopper is told the reason and may open a dispute.

**Benefit:** Fair decisions based on evidence.

### PRD-RET-005 Automatic refunds

| Key facts |  |
|---|---|
| Phase | Phase 1 |
| Pack | Always included |
| For | Business buyers and shoppers |
| Availability | Planned for phase 1 |

When a return or cancellation is approved, the refund starts automatically, including for part of an order.

**Who uses it:** Shoppers; finance staff

**What it does**

- Start the refund automatically when a return is accepted.
- Start a refund automatically when a paid order is cancelled or a paid service fails.
- Refund part of an order, item by item and by quantity.
- Show the refund status on the return and notify the shopper when it is complete.
- Start refunds requested by other parts of the product, such as bookings, partial supply or failed checkouts, in the same single place (proposed, to be confirmed).

**Rules**

- Each refund is requested only once for its source, so no customer is refunded twice (proposed, to be confirmed).
- No refund is requested for an unpaid order.

**Benefit:** Customers are refunded quickly without manual steps.

### PRD-RET-006 Return fees

| Key facts |  |
|---|---|
| Phase | Phase 1 |
| Pack | Commerce extensions pack (optional) |
| For | Business buyers and shoppers |
| Availability | Planned for phase 1 |

Charges such as restocking or return delivery fees can be applied to returns.

**Who uses it:** Client administrators; shoppers

**What it does**

- Set restocking fees as a fixed amount or a percentage, by category, seller or reason, with an effective date.
- Record a return delivery fee where the customer pays or shares the cost.
- Show estimated fees before the shopper submits the request.
- Show the refund breakdown: item amount, each fee and the net refund.

**Rules**

- Where fees exceed the refund, the refund is zero and staff are alerted.
- Fee rule changes are recorded.

**Benefit:** Covers the cost of returns where policy allows.

### PRD-RET-007 Dispute and issue cases

| Key facts |  |
|---|---|
| Phase | Phase 1 |
| Pack | Always included |
| For | Business buyers and shoppers |
| Availability | Depends on a pending decision: whether the workflow engine is built or an existing product is embedded (architecture decision) (ref WF-ENG) |

A case file for customer problems and disputes: evidence is attached, the decision is recorded, the remedy is carried out, and unresolved cases are escalated.

**Who uses it:** Shoppers; support staff; finance staff

**What it does**

- Report a missing, damaged or wrong item without a formal return, where policy allows.
- Open cases automatically when a parcel is lost, damaged or returned to sender.
- Keep one case file with status, parties, linked order, return and payment, evidence and a log of every step.
- Attach proof of delivery to the case automatically.
- Record a decision and propose a remedy: refund, replacement, repair or none.
- Escalate unresolved cases to the client's dispute process; for Malawi Post, its complaints and dispute policy.
- Show shoppers how disputes are resolved.
- Open a case for payment disputes and hold related payment steps while it is open (proposed, to be confirmed).

**Rules**

- A case closes only after the shopper accepts the remedy, or staff close it with a reason when the shopper does not answer; it never closes automatically.
- Repeated rejections of the remedy escalate the case.
- Each step is timed.
- An order cannot be accepted as complete while a case on it is open.

**Benefit:** Problems are resolved fairly and recorded.

### PRD-RET-008 Dispute time limits and escalation

| Key facts |  |
|---|---|
| Phase | Phase 1 |
| Pack | Marketplace pack (optional) |
| For | Sellers and staff (back office) |
| Availability | Depends on a pending decision: whether the workflow engine is built or an existing product is embedded (architecture decision) (ref WF-ENG) |

Time limits for handling disputes, automatic sorting by urgency, an escalation path up to regulators or independent bodies, and export of the full case file.

**Who uses it:** Support managers; client administrators; regulators

**What it does**

- Set time limits for seller response and for resolution, with a timer on every case.
- Escalate a case one level and notify people when its time limit is missed.
- Pause the timer while waiting for the customer, where the client chooses.
- Sort cases by urgency from the reason and order value.
- Escalate a case to a regulator or independent body and export the full case file with evidence and messages.
- Set the escalation levels and dispute rules in line with the client's policy.

**Rules**

- Malawi Post's escalation levels are to be confirmed.
- Escalations and exports are recorded.

**Benefit:** Disputes do not get stuck, and external bodies receive complete files.

### PRD-RET-009 Case retention and reports

| Key facts |  |
|---|---|
| Phase | Phase 1 |
| Pack | Service desk extensions pack (optional) |
| For | Business buyers and shoppers |
| Availability | Planned for phase 1 |

Keeps return and dispute records for the required period and reports on them.

**Who uses it:** Client administrators; management; auditors

**What it does**

- Keep returns, cases, messages and evidence for the required period, then archive or delete them.
- Report return rates, reasons, resolution times and outcomes.
- Produce the report automatically at the end of each period for download.

**Rules**

- The return rate definition is proposed, to be confirmed.
- Only authorised users can run the report.

**Benefit:** Shows trends and meets record-keeping rules.

### PRD-RET-010 Seller return review

| Key facts |  |
|---|---|
| Phase | Phase 1 |
| Pack | Marketplace pack (optional) |
| For | Sellers and staff (back office) |
| Availability | Planned for phase 1 |

Sellers review return requests for their products and respond within set time limits.

**Who uses it:** Sellers; client support staff; client administrators

**What it does**

- See return requests for own products with reason, evidence and due time.
- Approve, reject with a reason, or ask the shopper for more information.
- Receive a message for each new return request.
- Decide what happens when a seller does not respond in time: escalate to support or approve automatically (proposed, to be confirmed).
- Let client support overrule a seller rejection with a reason (proposed, to be confirmed).

**Rules**

- Sellers cannot see other sellers' returns.
- Seller responses and support decisions that overrule them are recorded.

**Benefit:** Marketplace returns are handled by the right seller on time.

### PRD-RET-011 Buyer and seller mediation

| Key facts |  |
|---|---|
| Phase | Phase 1 |
| Pack | Marketplace pack (optional) |
| For | Business buyers and shoppers |
| Availability | Depends on a pending decision: whether the workflow engine is built or an existing product is embedded (architecture decision) (ref WF-ENG) |

Buyer and seller message each other inside a dispute case, with moderation and a record, and the client can mediate.

**Who uses it:** Shoppers; sellers; support staff

**What it does**

- Exchange messages and attachments between buyer and seller inside the case.
- Let staff hide messages that break the rules, or approve messages before they appear.
- Let staff join as mediator and propose a remedy.
- Include the full message history in the exported case file.

**Rules**

- Only the parties and client staff can read the messages.
- Hidden messages are kept in the case record.

**Benefit:** Buyers and sellers can try to settle a dispute directly, with a record kept and the client able to step in.

<!-- pagebreak -->

## 7.13 Customer service, help desk and chat

This part of the product gives customers one place to ask for help and to complain: by web form, e-mail, phone, WhatsApp, chat or in person at an outlet. Support staff work every request as a ticket that is routed, timed, escalated and recorded, with a full view of the customer, internal notes, a knowledge base and approved ready-made answers. It also measures service quality, captures customer feedback, refers suspected fraud, and supports forums and named account managers for business customers.

### PRD-CRM-001 Help desk ticketing

| Key facts |  |
|---|---|
| Phase | Phase 1 |
| Pack | Always included |
| For | Business buyers and shoppers |
| Availability | Planned for phase 1 |

A help desk where every customer question or problem becomes a ticket. Each ticket is assigned to a department or agent and has a status, deadlines and attachments.

**Who uses it:** Shoppers; support staff; client administrators

**What it does**

- Shoppers send a question or complaint and get an automatic acknowledgement with a ticket number, the expected response time and how to follow up.
- Support staff assign each ticket to a department or an agent; the assignee is notified.
- Each ticket has a status and deadlines for first response and resolution, shown on the ticket and in the work queue.
- Registered shoppers see their own tickets, status, last update and the conversation in My account.
- Shoppers and agents attach files to a ticket, such as a photo of the problem.
- Client administrators set service-level targets and what happens when a target is missed (notify, raise priority, or move to the next level).
- A resolved ticket closes automatically if the customer does not reply within a set period (proposed, to be confirmed).

**Rules**

- A missed deadline marks the ticket as breached and escalates it.
- Allowed file types, maximum file size and the maximum number of files per ticket are set by the client.
- A shopper can never see another customer's tickets or attachments.

**Benefit:** No customer request gets lost, and every request is answered against a clear deadline.

### PRD-CRM-002 Multi-channel case intake

| Key facts |  |
|---|---|
| Phase | Phase 1 |
| Pack | Always included |
| For | Business buyers and shoppers |
| Availability | Planned for phase 1 |

Requests arriving by e-mail, phone, WhatsApp, the contact-us form or in person at an outlet become tickets in the same help desk. Duplicates are merged, and all communication is kept with the ticket.

**Who uses it:** Support staff; outlet staff; shoppers

**What it does**

- E-mails to the support address become tickets; replies that carry a ticket number are added to that ticket.
- Support staff log phone calls as new tickets or on existing tickets, with caller, category, notes and duration.
- WhatsApp messages become tickets, and agent replies go back to the customer on WhatsApp.
- Outlet staff record a walk-in customer's question as a ticket, with the outlet and the staff member recorded.
- A contact-us form sent by a shopper also becomes a ticket; extra questions the client adds to the form, such as order number or topic, are copied into the ticket.
- Agents merge duplicate tickets; the remaining ticket keeps all messages, attachments and history.
- Every message, call, chat transcript and outlet note is kept in the ticket history in time order.

**Rules**

- Automatic replies and delivery failures do not create tickets (proposed, to be confirmed).
- The same message never creates two tickets (proposed, to be confirmed).
- Possible duplicates are flagged for an agent to decide; nothing is merged automatically (proposed, to be confirmed).
- No WhatsApp reply is sent to a number that has opted out of WhatsApp messages.

**Benefit:** Support sees every contact in one place, whatever channel the customer used.

### PRD-CRM-003 Agent 360° view

| Key facts |  |
|---|---|
| Phase | Phase 1 |
| Pack | Always included |
| For | Staff (back office) |
| Availability | Planned for phase 1 |

One screen for support agents that shows a customer's profile, orders, payments, tracking, tickets, returns and disputes, with sensitive personal details hidden.

**Who uses it:** Support staff; support managers

**What it does**

- Find a customer by name, e-mail, phone, order number or ticket number.
- See profile, orders with payment and delivery status, payments and refunds, tracking history, messages sent, tickets, returns and disputes on one page.
- Open one order and see its order status, payment status and latest tracking update together.
- See the customer's consent and terms-acceptance history (read only).
- Follow links to the screens where refunds, cancellations or edits are made; the view itself changes nothing.

**Rules**

- Sensitive personal details are hidden unless the staff member's role allows them to be shown.
- Every time hidden details are revealed, the platform records who, which customer, which detail and when.

**Benefit:** Agents solve problems in one call while customer data stays protected.

### PRD-CRM-004 Complaints process

| Key facts |  |
|---|---|
| Phase | Phase 1 |
| Pack | Service desk extensions pack (optional) |
| For | Business buyers and shoppers |
| Availability | Depends on a pending decision: whether the workflow engine is built or an existing product is embedded (architecture decision) (ref WF-ENG); content that Malawi Post has not yet provided (service lists, return shipping models, priority e-Government services and the complaints and dispute policy) (ref T-MISS) |

A formal complaints process that follows the client's complaints and dispute-resolution policy, with a clear escalation path. The Malawi Post policy has not been provided yet.

**Who uses it:** Shoppers; support managers; client administrators

**What it does**

- Shoppers submit a formal complaint and receive a complaint reference and an acknowledgement.
- Complaints go to a dedicated complaints queue.
- Client administrators set up an escalation path by complaint category, with internal steps and external escalation points.
- Each escalation notifies the next level and is recorded.
- Where a complaint needs a remedy for a transaction, staff open a linked dispute case (proposed, to be confirmed).
- Where a complaint names a seller, the seller is notified and complaint counts per seller are available for seller performance (proposed, to be confirmed).

**Rules**

- For Malawi Post, the complaint steps will follow its complaints and dispute-resolution policy once it is provided.
- A complaint cannot be closed without a recorded outcome and a notice to the customer (proposed, to be confirmed).
- Escalation to an external regulator needs approval by a second person (proposed, to be confirmed).
- Every change to the escalation path is recorded (proposed, to be confirmed).

**Benefit:** Complaints are handled consistently and as the client's policy requires.

### PRD-CRM-005 Support quality analytics

| Key facts |  |
|---|---|
| Phase | Phase 1 |
| Pack | Analytics pack (optional) |
| For | Business buyers and shoppers |
| Availability | Planned for phase 1 |

Customer satisfaction ratings, support dashboards, complaint trends and early warnings. Customers rate the service, with an optional comment, after their ticket is resolved.

**Who uses it:** Shoppers; support managers

**What it does**

- Shoppers rate the service on the client's chosen scale and may add a comment when their ticket is resolved.
- Support managers see tickets created and resolved, response and resolution times, missed deadlines and average rating, by queue and by agent.
- Dashboards can be narrowed by channel and category and exported to Excel.
- Managers see complaint trends by category over a chosen period.
- Managers are warned when complaints in a category pass a threshold the client sets.

**Rules**

- One rating per resolved ticket.
- Ratings are used only in totals and averages on dashboards.
- A rating link expires after a set period (proposed, to be confirmed).

**Benefit:** Managers see where service needs to improve, and act before problems grow.

### PRD-CRM-006 Ticket collaboration and audit

| Key facts |  |
|---|---|
| Phase | Phase 1 |
| Pack | Service desk extensions pack (optional) |
| For | Staff (back office) |
| Availability | Planned for phase 1 |

Agents leave internal notes on tickets, link tickets to return and dispute cases, and every action on a ticket is recorded.

**Who uses it:** Support staff; support managers

**What it does**

- Agents write internal notes that only staff can see.
- Agents open a dispute or return case from a ticket, linked both ways.
- Agents link an existing return or case to a ticket; the link shows on both records.
- Every change to a ticket (status, assignment, priority, category, notes, merge) is recorded with who did it, when, and the old and new values.
- Staff view the full history of a ticket in time order.

**Rules**

- Internal notes never appear on customer pages or in customer e-mails.

**Benefit:** Support staff work together on cases, and every action is accountable.

### PRD-CRM-007 Knowledge base

| Key facts |  |
|---|---|
| Phase | Phase 1 |
| Pack | Always included |
| For | Business buyers and shoppers |
| Availability | Planned for phase 1 |

A library of help articles and FAQs, approved before publishing, plus approved ready-made answers for agents.

**Who uses it:** Shoppers; support staff; support managers

**What it does**

- Shoppers browse help articles by category in a help centre.
- Shoppers search help articles by keyword (proposed, to be confirmed).
- New or changed articles are hidden from shoppers until approved.
- Agents insert approved ready-made answers into replies, with details such as customer name and order number filled in.
- The same approved answers are used by live chat, WhatsApp replies and the chatbot.
- Staff see every version of a ready-made answer, with author, approver and dates.
- Questions the chatbot could not answer can be turned into new draft answers (proposed, to be confirmed).

**Rules**

- An article or answer must be approved by someone other than its author.
- Only the latest approved version of an answer is used; earlier versions are kept.
- A rejected article stays unpublished, and the author sees the reason.

**Benefit:** Customers help themselves, and agents answer consistently on every channel.

### PRD-CRM-008 Live web chat

| Key facts |  |
|---|---|
| Phase | Phase 1 |
| Pack | Engagement and loyalty pack (optional) |
| For | Business buyers and shoppers |
| Availability | Planned for phase 1 |

A live chat window on the website where customers chat with staff.

**Who uses it:** Shoppers; KTDA customers; support staff

**What it does**

- Shoppers open a chat window on any shop page and reach online staff.
- When no staff are online, the message is kept and becomes a ticket.
- Signed-in shoppers' name and e-mail are passed to the chat, where data-protection consent allows (proposed, to be confirmed).
- KTDA customers chat with KTDA through WhatsApp Business and WeChat; agents reply with text, images and documents.
- Chat transcripts are attached to the customer's open ticket or to a new ticket (proposed, to be confirmed).
- When the chatbot hands a conversation to staff, the transcript goes with it (proposed, to be confirmed).

**Rules**

- No reply is sent to a customer who has opted out of that channel.

**Benefit:** Customers get instant help while shopping, on the apps they already use.

### PRD-CRM-009 Contact and messaging

| Key facts |  |
|---|---|
| Phase | Phase 1 |
| Pack | Always included |
| For | Business buyers and shoppers |
| Availability | Planned for phase 1 |

Contact-us and contact-the-seller forms, and message threads between customers and the shop.

**Who uses it:** Shoppers; sellers; support staff

**What it does**

- Shoppers send a question or complaint with the contact-us form; a confirmation is shown.
- Shoppers contact a seller about the seller's products, where the client allows it.
- Registered shoppers see their exchanges with the shop as conversation threads in My account.
- Support staff send an e-mail or message to a customer from the back office.

**Rules**

- The contact form can be protected by a CAPTCHA check against automated spam.
- A sent contact-us form also creates a ticket when the client switches this on.

**Benefit:** Customers can easily ask questions of the shop and of sellers.

### PRD-CRM-010 Fraud reporting and referral

| Key facts |  |
|---|---|
| Phase | Phase 1 |
| Pack | Service desk extensions pack (optional) |
| For | Business buyers and shoppers |
| Availability | Planned for phase 1 |

When fraud is suspected, a defined process refers the case to the fraud team.

**Who uses it:** Fraud staff; support staff

**What it does**

- Cases are referred to fraud staff automatically when indicators appear, such as repeated complaints against a seller in a set period.
- Payment risk warnings also create a referral (proposed, to be confirmed).
- Support staff refer a ticket, case or customer as suspected fraud, with a reason.
- Fraud staff review each referral and record the outcome (confirmed or unfounded), notes and actions taken.

**Rules**

- Only one open referral per customer, seller or transaction; new indicators are added to it (proposed, to be confirmed).
- Only fraud staff can review referrals and record outcomes.
- Every outcome is recorded.

**Benefit:** Suspected fraud is dealt with quickly and consistently, and decisions are on record.

### PRD-CRM-011 Experience feedback

| Key facts |  |
|---|---|
| Phase | Phase 1 |
| Pack | Engagement and loyalty pack (optional) |
| For | Business buyers and shoppers |
| Availability | Planned for phase 1 |

Customers give feedback on the service and their overall experience, and staff record what they did about it.

**Who uses it:** Shoppers; management; staff

**What it does**

- After an order is complete, shoppers are invited to rate their overall experience and the service, with an optional comment.
- Registered shoppers give general feedback through a feedback form.
- Product feedback goes to the normal product review form, so it is not collected twice.
- Staff list feedback by type, rating and period, record an action note and close it.
- Shoppers see their feedback and the staff response in My account, if KTDA confirms this is wanted.

**Rules**

- Every staff action on feedback is recorded.

**Benefit:** The client learns what to improve, and customers see that their feedback is heard.

### PRD-CRM-012 Support channel directory

| Key facts |  |
|---|---|
| Phase | Phase 2 |
| Pack | Service desk extensions pack (optional) |
| For | Business buyers and shoppers |
| Availability | Planned for phase 2 |

Shows the ways to get help (phone, chat, e-mail, WhatsApp, outlets) with opening hours and expected waiting times.

**Who uses it:** Shoppers

**What it does**

- Shoppers see every support channel with its opening hours on the help page.
- Shoppers see the expected waiting time for chat and tickets, based on recent response times (proposed, to be confirmed).
- A channel outside its opening hours is shown as closed, with its next opening time (proposed, to be confirmed).

**Benefit:** Customers choose the fastest way to get help.

### PRD-CRM-013 Community forums

| Key facts |  |
|---|---|
| Phase | Phase 3 |
| Pack | Engagement and loyalty pack (optional) |
| For | Individual shoppers |
| Availability | Planned for phase 3 |

Online discussion forums for customers, moderated by staff.

**Who uses it:** Shoppers; forum moderators; client administrators

**What it does**

- Registered shoppers post topics and replies.
- Forum moderators edit or delete posts and topics.
- Client administrators set up forum groups and forums.
- Forums are a ready-made add-on, switched on only for a client that wants them.

**Benefit:** Builds a community where customers help each other.

### PRD-CRM-014 Issue routing and escalation

| Key facts |  |
|---|---|
| Phase | Phase 1 |
| Pack | Always included |
| For | Business buyers and shoppers |
| Availability | Planned for phase 1 |

Support requests are grouped into categories, sent automatically to the right team and escalated from first-line support to specialists. Customers report order problems directly, with the order details filled in.

**Who uses it:** Shoppers; support staff; support managers

**What it does**

- Shoppers choose Report a problem on the order page; order number, items, statuses and tracking numbers are filled in for them.
- Shoppers pick an issue type such as missing parcel, delayed delivery or payment issue.
- Where the problem needs an item remedy (missing, damaged or wrong item), a linked return or dispute case is also opened (proposed, to be confirmed).
- Support managers set categories and routing rules by service type, order status and location.
- First-line agents escalate a ticket, with a reason, to a specialist team such as payments operations, logistics operations or technical support.
- Tickets escalate automatically when a deadline is missed (proposed, to be confirmed).
- One set of deadline rules applies to tickets, return requests and dispute cases (proposed, to be confirmed).

**Rules**

- Routing rules are checked in order; the first match decides the team, and a default team takes anything else.
- Location is taken from the order's delivery address.
- A shopper can report a problem only on their own orders.

**Benefit:** Requests reach the right person fast, and customers do not retype order details.

### PRD-CRM-015 B2B account management

| Key facts |  |
|---|---|
| Phase | Phase 2 |
| Pack | Business trade pack (optional) |
| For | Business buyers |
| Availability | Planned for phase 2 |

A business customer can be given a named account manager, who can place orders on the customer's behalf.

**Who uses it:** Business buyers; account managers; sales staff; client administrators

**What it does**

- Administrators assign an account manager to a business customer.
- Business buyers see their account manager's name and contact details in My account.
- Account managers place orders on behalf of their business customers; each order notes the manager.

**Rules**

- An account manager can place orders only for the customers assigned to them; other attempts are refused and recorded.
- Starting and finishing an order on behalf of a customer are both recorded.

**Benefit:** Important business customers get personal service under control.

<!-- pagebreak -->

## 7.14 Marketing, promotions, loyalty, content and SEO

This part of the product gives client staff the tools to promote and explain the shop without developers. It covers discounts and promo codes, advanced promotions, reward points, gift cards and vouchers, newsletters and e-mail campaigns, pop-ups, and web content with approval and policy versions. It also covers search-engine visibility, marketing measurement and social links, customer segments, abandoned-cart reminders, affiliates and referrals, and seller-managed prices and discounts in a marketplace.

### PRD-MKT-001 Discounts and coupons

| Key facts |  |
|---|---|
| Phase | Phase 1 |
| Pack | Always included |
| For | Business buyers and shoppers |
| Availability | Planned for phase 1 |

Percentage or fixed discounts on products, categories, brands, whole orders or delivery, with promo codes, dates, usage limits and conditions.

**Who uses it:** Marketing staff; shoppers

**What it does**

- Marketing staff create percentage or fixed discounts on products, categories, brands, the order total or delivery.
- Discounts run only between their start and end dates.
- Sitewide discounts apply to every cart that meets the conditions.
- Discounts can be limited to a customer group, and capped at a maximum amount.
- Shoppers enter a promo code in the cart and see the discount in the order totals.
- Every use of a code and every change to a discount is recorded.

**Rules**

- Unknown, expired, inactive or ineligible codes are refused with a clear message.
- A code can be limited to a number of uses in total or per customer.
- When two checkouts race for the last allowed use of a code, only one succeeds (proposed, to be confirmed).
- Where discounts cannot be combined, only one is applied; combinable discounts are added together.

**Benefit:** Staff run standard promotions themselves, and codes cannot be abused.

### PRD-MKT-002 Advanced promotions

| Key facts |  |
|---|---|
| Phase | Phase 1 |
| Pack | Engagement and loyalty pack (optional) |
| For | Business buyers and shoppers |
| Availability | Planned for phase 1 |

More advanced offers such as buy-one-get-one-free, discounts by spending band and bundle offers.

**Who uses it:** Marketing staff; shoppers

**What it does**

- Marketing staff set up buy-X-get-Y-free offers, for example buy one get one free.
- The free units and the saving are shown in the cart and kept on the order.
- Marketing staff set discounts that grow with the amount spent, in spending bands (proposed, to be confirmed; KTDA has not yet defined "banding").
- Marketing staff set bundle offers that apply when all products of a set are bought together (proposed, to be confirmed).

**Rules**

- Buy one get one free: with 2 units one is free; with 3 units one is free (proposed, to be confirmed).
- If a buy-X-get-Y saving and another non-combinable discount both apply, only the larger saving counts (proposed, to be confirmed).
- Only one spending band applies; a total equal to a band's lower limit falls in that band (proposed, to be confirmed).
- A bundle discount is removed from all its products if any one is taken out of the cart (proposed, to be confirmed).

**Benefit:** Richer promotions that drive sales and reward larger baskets.

### PRD-MKT-003 Reward points

| Key facts |  |
|---|---|
| Phase | Phase 1 |
| Pack | Engagement and loyalty pack (optional) |
| For | Individual shoppers |
| Availability | Planned for phase 1 |

Customers earn points when they buy and spend them on later purchases, with expiry dates and limits.

**Who uses it:** Shoppers; marketing staff

**What it does**

- Shoppers earn points when an order is complete and above a minimum value.
- Shoppers use points at checkout as an amount off the order total.
- Shoppers see their points balance and history in My account.
- Marketing staff set the earning rate, the value of a point, minimum and maximum use, and how long points stay valid.

**Rules**

- Points from a cancelled order are taken back.
- Expired points cannot be used and do not count in the balance.
- New settings apply to new awards only; past history is unchanged and the change is recorded (proposed, to be confirmed).

**Benefit:** Rewards loyal customers within a budget the client controls.

### PRD-MKT-004 Gift cards and vouchers

| Key facts |  |
|---|---|
| Phase | Phase 1 |
| Pack | Always included |
| For | Business buyers and shoppers |
| Availability | Planned for phase 1 |

Physical or digital gift cards and vouchers that customers buy and redeem.

**Who uses it:** Shoppers; marketing staff

**What it does**

- Shoppers buy a digital or physical gift card for someone; the recipient of a digital card is notified.
- Gift cards are activated when the order is complete or shipped, or by staff, as the client chooses.
- Shoppers redeem a gift card or voucher code at checkout; the remaining amount is deducted, up to the order total.
- Marketing staff issue vouchers and see each order and amount where a voucher was used.

**Rules**

- Cards that are not activated or have no balance are refused with a clear message.
- If an order paid partly by gift card is cancelled, the amount can be made available again.
- Every use and every change to a card is recorded.

**Benefit:** Gift sales and promotions that are validated and traceable.

### PRD-MKT-005 Newsletter and e-mail campaigns

| Key facts |  |
|---|---|
| Phase | Phase 1 |
| Pack | Always included |
| For | Business buyers and shoppers |
| Availability | Planned for phase 1 |

Manage newsletter subscribers and send e-mail campaigns to chosen groups.

**Who uses it:** Shoppers; marketing staff

**What it does**

- Shoppers subscribe to the newsletter types they choose and confirm by e-mail.
- Shoppers unsubscribe at any time.
- Marketing staff send campaigns to chosen customer groups and newsletter types, not before a chosen date.
- Marketing staff send a test e-mail before the campaign goes out.
- Subscribers can be kept in step with Omnisend if the client uses it for campaigns.

**Rules**

- A subscription becomes active only after the shopper confirms it.
- No campaigns are sent to an address that has unsubscribed.
- Only staff allowed to manage settings can open the Omnisend settings (proposed, to be confirmed).

**Benefit:** Keeps customers engaged with news they have chosen to receive.

### PRD-MKT-006 On-site pop-ups

| Key facts |  |
|---|---|
| Phase | Phase 1 |
| Pack | Engagement and loyalty pack (optional) |
| For | Business buyers and shoppers |
| Availability | Planned for phase 1 |

Pop-up boxes on the site for promotions or newsletter sign-up, shown under rules the client sets.

**Who uses it:** Marketing staff; shoppers

**What it does**

- Marketing staff choose which pages show a pop-up, for which customer group, in which period and language.
- Marketing staff set how often a visitor sees a pop-up, for example once every few days (proposed, to be confirmed).
- Shoppers subscribe to the newsletter from a pop-up.
- Shoppers close a pop-up with the keyboard (proposed, to be confirmed).

**Rules**

- A pop-up shows only when all its rules match.
- A pop-up is not shown to visitors who have not accepted the matching cookie category (proposed, to be confirmed).
- If a pop-up has no text in the shopper's language, the default language is shown (proposed, to be confirmed).

**Benefit:** Draws attention to offers without annoying shoppers.

### PRD-MKT-007 Content management

| Key facts |  |
|---|---|
| Phase | Phase 1 |
| Pack | Always included |
| For | Business buyers and shoppers |
| Availability | Planned for phase 1 |

Create and edit web pages, blog posts, news, banners, menus and policy pages with pictures and video, without developers. Includes simple polls for customers.

**Who uses it:** Content staff; client administrators; shoppers

**What it does**

- Content staff create and publish or unpublish pages with text, pictures and video.
- Pages, blog posts and news can be shown only between set dates.
- Content staff manage home-page banners with picture, title, description for screen readers and link.
- Client administrators publish policy pages and legal notices (privacy, terms, shipping, returns, complaints), linked from the footer and checkout.
- Shoppers read FAQ and help pages from a help menu.
- Client administrators publish onboarding and training content for new users (placement proposed, to be confirmed).
- Content staff publish simple polls; each registered shopper votes once.
- News and polls are ready-made add-ons, switched on only for a client that uses them.

**Benefit:** The client keeps the site's content up to date itself.

### PRD-MKT-008 Content approval and policy versioning

| Key facts |  |
|---|---|
| Phase | Phase 1 |
| Pack | Always included |
| For | Business buyers and shoppers |
| Availability | Depends on a pending decision: whether the workflow engine is built or an existing product is embedded (architecture decision) (ref WF-ENG) |

New and changed content and policy pages need approval before going live, and each version of a policy is kept.

**Who uses it:** Content approvers; content staff; legal staff

**What it does**

- New and changed pages, news and blog posts wait for approval before going live.
- Approvers approve or reject with a reason; the author can edit and resubmit.
- Help articles of the knowledge base follow the same approval.
- When a policy change is approved, a new version is created with an effective date.
- The approver decides whether customers must accept the new version again.
- Legal staff read the full history of policy versions.

**Rules**

- Nobody can approve their own content.
- Policy versions cannot be edited or deleted; corrections become new versions (proposed, to be confirmed).
- Each customer or seller acceptance of a policy refers to a version number.

**Benefit:** Prevents mistakes on public pages and keeps a legal record of policies.

### PRD-MKT-009 SEO

| Key facts |  |
|---|---|
| Phase | Phase 1 |
| Pack | Always included |
| For | Business buyers and shoppers |
| Availability | Planned for phase 1 |

Search-engine-friendly page addresses, page titles and descriptions, a sitemap and the other settings that help Google and social media show the shop properly.

**Who uses it:** Marketing staff

**What it does**

- Set readable page addresses, titles and descriptions for products, categories, brands, pages, blog posts and news.
- Generate a product description for search engines from the product summary when none is entered.
- Ask the AI assistant to suggest titles and descriptions for staff review, where AI is switched on.
- Publish a sitemap and instructions for search engines, with one preferred address per page.
- Include structured product details so search engines can show product information.
- Give each language its own page addresses.
- Show the right title, description and picture when a page is shared on social media.

**Benefit:** More visitors from search engines and better-looking shared links.

### PRD-MKT-010 Marketing tags and social

| Key facts |  |
|---|---|
| Phase | Phase 1 |
| Pack | Always included |
| For | Business buyers and shoppers |
| Availability | Planned for phase 1 |

Connects marketing measurement tools such as Google Analytics, Google Ads and the Facebook Pixel, and adds social sharing buttons and links.

**Who uses it:** Marketing staff; shoppers

**What it does**

- Marketing staff connect Google Analytics, including sales tracking.
- Marketing staff connect the Facebook Pixel and other advertising tags, such as Google Ads.
- Shoppers share products on social media with share buttons.
- The footer shows links to the client's social media pages.
- Sales from campaign links are credited to the campaign in Google Analytics for the marketing dashboard.

**Rules**

- Measurement and advertising tags follow the consent rules of the country's data-protection profile.
- Where consent is needed, tags load only after the visitor accepts (proposed, to be confirmed).

**Benefit:** Marketing is measured and sharing the shop is easy.

### PRD-MKT-011 Customer segmentation attributes

| Key facts |  |
|---|---|
| Phase | Phase 1 |
| Pack | Always included |
| For | Business buyers and shoppers |
| Availability | Planned for phase 1 |

Records customer details such as gender, age, rural or urban location and buyer type, and seller type, for targeting and reporting.

**Who uses it:** Marketing staff; management; client administrators

**What it does**

- Customers give gender and date of birth when they register; age is worked out from the date of birth.
- Customers choose a location type (rural or urban) and buyer type.
- Sellers record their size, for example small or medium enterprise.
- Marketing staff define segments from these details, for example rural farmers (proposed, to be confirmed).
- Campaigns and discounts can be aimed at a segment.

**Rules**

- Segment membership is updated automatically from the segment rule; manual changes are overwritten (proposed, to be confirmed).

**Benefit:** Better-targeted marketing and reporting on inclusion.

### PRD-MKT-012 Abandoned-cart recovery

| Key facts |  |
|---|---|
| Phase | Phase 2 |
| Pack | Engagement and loyalty pack (optional) |
| For | Individual shoppers |
| Availability | Planned for phase 2 |

Sends up to three e-mail reminders to registered customers who left items in their cart without buying; the client can add an SMS reminder.

**Who uses it:** Marketing staff; shoppers

**What it does**

- Registered shoppers with an e-mail address who leave items in their cart receive up to three reminders, at times the client sets.
- Reminders are built into the platform, so no outside marketing service or subscription is needed.
- Client staff switch reminders on or off and edit the wording and timing of each reminder.
- The client can also send each reminder by SMS to the customers who receive the e-mail reminders.

**Rules**

- No reminder is sent to a shopper who has not given marketing consent where the data-protection profile requires it (proposed, to be confirmed).
- Guests and customers without an e-mail address receive no reminders.
- Reminder timing for each client is to be confirmed.

**Benefit:** Recovers sales that would otherwise be lost.

### PRD-MKT-013 Affiliates and referrals

| Key facts |  |
|---|---|
| Phase | Phase 2 |
| Pack | Engagement and loyalty pack (optional) |
| For | Individual shoppers |
| Availability | Planned for phase 2 |

Partners or customers share special links and earn rewards for the sales they bring.

**Who uses it:** Marketing staff; affiliates; registered customers; finance staff

**What it does**

- Partners share tracked links; orders from those links appear in the partner's order list.
- Partners can be notified when an order they brought is placed or paid.
- Registered customers share a referral link and earn reward points when the new customer's first order is complete (proposed, to be confirmed).
- Marketing staff set commission rules for partners, as a share of the order value (proposed, to be confirmed).
- Finance staff pay commissions that are due and record the payment reference.

**Rules**

- A referral reward is given once per new customer (proposed, to be confirmed).
- No reward if the new customer uses the same e-mail, phone or device as the referrer (proposed, to be confirmed).
- A commission becomes payable only after a holding period without refund, and is reversed if the order is refunded first (proposed, to be confirmed).

**Benefit:** Existing customers and partners bring in new customers, with each referral tracked.

### PRD-MKT-014 Seller-managed pricing and promotions

| Key facts |  |
|---|---|
| Phase | Phase 1 |
| Pack | Marketplace pack (optional) |
| For | Sellers and staff (back office) |
| Availability | Planned for phase 1 |

Sellers set their own base prices, discounts and promotional prices with start and end dates.

**Who uses it:** Sellers

**What it does**

- Sellers set the prices of their own products.
- Sellers set promotional prices that apply only between start and end dates.
- Sellers create their own discounts on their own products, with dates.

**Rules**

- Sellers cannot see or change other sellers' products or discounts.
- Seller discounts can include only that seller's products; the platform applies this itself.
- Every price or discount change by a seller is recorded (proposed, to be confirmed).

**Benefit:** Sellers run their own shop within the marketplace.

<!-- pagebreak -->

## 7.15 Reporting and analytics

This part of the product gives staff ready-made reports and a dashboard from day one. It also feeds a separate data warehouse and business-intelligence (BI) platform that deliver executive, operational, commerce, marketing, compliance and e-government dashboards, scheduled and self-service reports, and control over who sees which report. The warehouse and the BI platform are separate systems; the platform supplies their data, the list of key measures and secure read-only connections.

### PRD-RPT-001 Standard reports and dashboard

| Key facts |  |
|---|---|
| Phase | Phase 1 |
| Pack | Always included |
| For | Staff (back office) |
| Availability | Planned for phase 1 |

Ready-made reports and a home dashboard for staff: sales summary, best sellers, low stock, products never sold, sales by country and customer reports.

**Who uses it:** Management; staff; client administrators

**What it does**

- Staff see a home dashboard with order and customer figures, in text and charts, latest orders, popular searches and best sellers.
- Run a sales summary by day, week or month, narrowed by order and payment status.
- Rank best sellers by quantity or amount to see fast movers.
- List products never sold in a period, and products at or below their minimum stock level.
- Run a fast and slow movers report with units sold, current stock per warehouse and days of cover.
- Run sales by country, registered customers and best-customer reports.
- Export every row of any standard report to Excel or XML.
- Client administrators give each role only the reports it needs.

**Rules**

- Each dashboard card and report is shown only to roles allowed to see it.

**Benefit:** Basic business information from day one.

### PRD-RPT-002 KPI framework and executive dashboards

| Key facts |  |
|---|---|
| Phase | Phase 1 |
| Pack | Always included |
| For | Staff (back office) |
| Availability | Depends on a pending decision: whether a licensed add-on is bought or the capability is built (technical and Product Owner decision) (ref PAID-STUB) |

The client defines the key measures it wants to track, sees them on executive dashboards, clicks through to the detail, builds its own dashboards and gets a monthly operations report filled in automatically.

**Who uses it:** Management; analysts

**What it does**

- Managers see registrations, active buyers and sellers, gross merchandise value, orders and conversion rate for any period.
- Each measure is shown as a figure and as a chart, and can be exported.
- Analysts add new key measures with their formulas without new development.
- Managers click from a measure down to the records behind it, for example by store, category, seller or region.
- Analysts build their own dashboards from the agreed measures and share them with a group.
- A monthly operations report is generated from system figures at month end.

**Rules**

- Every measure has one agreed definition, used by every dashboard.
- A changed definition takes effect from a set date; earlier periods keep the old definition.
- Conversion rate needs website visit data from Google Analytics; without it the measure is shown as not available.
- Until a financial-year calendar is available (later phase), reports use calendar years, quarters and months and say so (proposed, to be confirmed).

**Benefit:** Leaders see business performance at a glance and can find the cause of a change.

### PRD-RPT-003 Data warehouse

| Key facts |  |
|---|---|
| Phase | Phase 1 |
| Pack | Always included |
| For | Staff (back office) |
| Availability | Planned for phase 1 |

A separate reporting data store that collects and cleans data from the shop and other systems, with a data dictionary, quality checks and anonymisation, ready for analytics and AI tools.

**Who uses it:** Analysts; management; client administrators; KTDA analysts

**What it does**

- Data is copied regularly from the shop and other systems into the warehouse.
- Help-desk and customer-service data are included, so service can be analysed alongside sales.
- A data dictionary describes every item of reporting data and whether it is personal data.
- Quality checks report missing values, duplicates and invalid statuses; failed data is not loaded and the data owner is told.
- Personal data is disguised or removed before it leaves the platform, where policy requires.
- KTDA's AI and advanced analytics platforms can read the warehouse data, once KTDA names them.

**Rules**

- Copying runs from a copy of the shop data or in a quiet period, so the shop is not slowed down.
- A failed copy is retried, administrators are told, and the next run restarts from the last good point (proposed, to be confirmed).
- The key used to disguise personal data never leaves the client's own installation.

**Benefit:** Reliable data for analysis without slowing down the shop.

### PRD-RPT-004 Report delivery and self-service

| Key facts |  |
|---|---|
| Phase | Phase 1 |
| Pack | Always included |
| For | Staff (back office) |
| Availability | Planned for phase 1 |

Reports can be scheduled and e-mailed, exported in several formats and built by staff themselves. Saved queries and analyses can be shared, commented on and versioned.

**Who uses it:** Staff; analysts; client administrators

**What it does**

- Schedule reports to be e-mailed to named recipients at a set frequency and format.
- Analysts ask their own questions of the agreed reporting data and export the answers to Excel or CSV.
- Export reports to PDF, Excel or CSV, and charts as images.
- Save, share and comment on queries, with a history of versions.
- Share authorised report data with other government or Malawi Post systems by file or by a connection to other systems.

**Rules**

- A recipient who is not allowed to see a report cannot be added to its schedule (proposed, to be confirmed).
- Self-service questions run on the warehouse, never on the live shop.
- Each other system receives only the data it is authorised for, and every delivery is recorded.

**Benefit:** Staff get the reports they need without developers.

### PRD-RPT-005 Report access control

| Key facts |  |
|---|---|
| Phase | Phase 1 |
| Pack | Always included |
| For | Staff (back office) |
| Availability | Planned for phase 1 |

Controls who can see which reports and dashboards, and which data in them.

**Who uses it:** Client administrators; management; auditors

**What it does**

- Give or refuse each role access to each report.
- Link BI platform groups to the client's roles, so only members see a dashboard.
- Hide or mask personal and sensitive data for users without the right to see it.
- Limit users to the rows of their own store, seller or region (proposed, to be confirmed).

**Rules**

- Changes to who can see what are recorded (proposed, to be confirmed).

**Benefit:** Sensitive data in reports stays protected.

### PRD-RPT-006 Compliance and audit reports

| Key facts |  |
|---|---|
| Phase | Phase 1 |
| Pack | Always included |
| For | Staff (back office) |
| Availability | Planned for phase 1 |

Reports for regulators and auditors, including who accessed what and what was changed.

**Who uses it:** Auditors; compliance staff

**What it does**

- Auditors open the compliance report of sign-ins, staff actions and setting changes from the reports menu.
- Compliance staff see counts, statuses and handling times for complaints, anti-money-laundering flags, fraud referrals and privacy requests.
- Reports for a regulator follow that regulator's format, once the format is provided.
- Auditors see which staff viewed which customer and order records, and when (proposed, to be confirmed).

**Benefit:** Supports audits and regulatory reporting.

### PRD-RPT-007 Public transparency dashboard

| Key facts |  |
|---|---|
| Phase | Phase 3 |
| Pack | Analytics pack (optional) |
| For | Staff (back office) |
| Availability | Planned for phase 3 |

A public web page with anonymised figures about the platform's activity.

**Who uses it:** The public; funders; client administrators

**What it does**

- Visitors see totals about the platform's activity without signing in.
- Client administrators choose which figures are public and publish the page.
- Figures are refreshed on a schedule the client sets.

**Rules**

- Only totals are shown; no personal data can be selected.
- Figures based on very small groups are hidden (proposed, to be confirmed).

**Benefit:** Transparency for public programmes and their funders.

### PRD-RPT-008 External BI connectivity

| Key facts |  |
|---|---|
| Phase | Phase 2 |
| Pack | Analytics pack (optional) |
| For | Staff (back office) |
| Availability | Depends on a pending decision: whether a licensed add-on is bought or the capability is built (technical and Product Owner decision) (ref PAID-STUB) |

Lets the client's own business-intelligence tools, such as Power BI, connect to the reporting data.

**Who uses it:** Analysts; client administrators

**What it does**

- Connect Power BI through a licensed Power BI add-on, showing ready-made reports for the store.
- Or connect the client's own BI tool to the warehouse, read only.

**Rules**

- No connection can change shop data.
- Connection passwords are stored encrypted in the client's own installation, never in configuration packs.

**Benefit:** The client analyses data in tools it already uses.

### PRD-RPT-009 Operator performance metrics

| Key facts |  |
|---|---|
| Phase | Phase 2 |
| Pack | Always included |
| For | Staff (back office) |
| Availability | Planned for phase 2 |

Measures the productivity of each staff member or team and whether they meet service-level targets.

**Who uses it:** Operations managers; operations staff

**What it does**

- Managers see items handled per staff member and per team for a period, across work queues, tickets, returns and cases.
- Managers see the share of deadlines met and missed per staff member.
- Managers see rework and dispute rates per staff member, once the client defines them.
- Staff with personal access see only their own figures (proposed, to be confirmed).

**Benefit:** Managers see where teams need support.

### PRD-RPT-010 Operational dashboards

| Key facts |  |
|---|---|
| Phase | Phase 1 |
| Pack | Analytics pack (optional) |
| For | Staff (back office) |
| Availability | Depends on a pending decision: whether a licensed add-on is bought or the capability is built (technical and Product Owner decision) (ref PAID-STUB) |

Day-to-day dashboards for delivery, payments, seller performance and fraud, plus case-load, throughput, exception-rate and service-level dashboards, the complaint backlog and scheme review queues.

**Who uses it:** Operations managers; finance staff; marketplace managers; fraud staff

**What it does**

- See on-time delivery, delivery success and average transit time by outlet, hub, user and service.
- See payment success, payment method mix, reconciliation problems and refunds by payment method.
- See seller performance (on-time fulfilment, cancellations, returns, ratings) and export it.
- See flagged transactions, warnings per rule and fraud referral outcomes.
- See open case-load, throughput, exception rate and deadlines met per queue, the complaint backlog and average service rating.
- See scheme review queues where the schemes pack is active.

**Rules**

- Delivery measures use the same agreed definitions as the logistics dashboard.

**Benefit:** Operational teams spot problems as they happen.

### PRD-RPT-011 Commerce and marketing analytics

| Key facts |  |
|---|---|
| Phase | Phase 1 |
| Pack | Always included |
| For | Staff (back office) |
| Availability | Depends on a pending decision: whether a licensed add-on is bought or the capability is built (technical and Product Owner decision) (ref PAID-STUB) |

Analysis of costs, customer groups, abandoned carts, campaign results, segments, trends over time and groups of customers who joined at the same time. Advertising spend can be imported to compare costs with sales; the cost sources are to be confirmed with the client.

**Who uses it:** Marketing staff; management; KTDA managers; Malawi Post managers; analysts

**What it does**

- See a cost dashboard: product cost, delivery charged, returns, discounts, advertising spend and taxes, by period and category.
- Import advertising and campaign spend from a file; invalid rows are listed and valid rows are loaded.
- See customers and sales by gender, age band, location, customer group and segment, with buying behaviour.
- See abandoned carts with their value, top products and how many were recovered.
- See campaign results: orders and revenue per promo code, newsletters sent, campaign visits and cost per order.
- For Malawi Post, see buyers and sales by district or outlet, buyer type, age, gender, rural or urban location and seller type.
- See trends with year-on-year comparison, and groups by sign-up month and first-order month.

**Rules**

- Money amounts are labelled with their currency; totals in the customer's currency are offered too.
- A new spend file for the same source and dates replaces the earlier one, so spend is never counted twice (proposed, to be confirmed).
- Age and gender appear only where the client collects them.

**Benefit:** Shows what drives sales and where money is spent.

### PRD-RPT-012 e-Government and engagement reports

| Key facts |  |
|---|---|
| Phase | Phase 1 |
| Pack | e-Government pack (optional) |
| For | Citizens and businesses (government services) |
| Availability | Depends on a pending decision: whether postal operations, e-Government services and Malawi Post financial services are part of the product (Malawi Post to decide) (ref FG-06); whether a licensed add-on is bought or the capability is built (technical and Product Owner decision) (ref PAID-STUB) |

Reports on use of e-government services by agency, and on community engagement.

**Who uses it:** Malawi Post; government agencies

**What it does**

- See applications, fees collected and passed on, and progress, by agency and service type (proposed, to be confirmed; depends on the e-government scope being confirmed).
- Add community engagement data to the adoption dashboards by district and period, once its source is named.

**Benefit:** Shows the value delivered by public services on the platform.

<!-- pagebreak -->

## 7.16 Administration, workflow and operations console

This part of the product gives client staff one back office to run the shop. It also provides the configurable tools that replace per-client development: a workflow designer for business processes, a business rules tool, transaction types, eligibility and quota rules, and approval queues. Operations staff get a console with work queues, an exception queue and alerts. Uploads are checked and scanned for viruses, and reusable transaction templates are kept in a versioned library.

### PRD-ADM-001 Administration console

| Key facts |  |
|---|---|
| Phase | Phase 1 |
| Pack | Always included |
| For | Staff (back office) |
| Availability | Planned for phase 1 |

The back-office control panel for settings, add-ons, page widgets, scheduled jobs, system logs, maintenance, products and customers. Staff can change many products at once and archive products in bulk.

**Who uses it:** Client administrators; catalogue managers; platform team

**What it does**

- Client administrators reach settings, add-ons, page widgets, scheduled jobs, system logs, maintenance, products and customers from one back office.
- Administrators change how often a scheduled job runs, switch it on or off, or run it now, and see when it last ran.
- Catalogue managers change name, product code, price, old price, quantity or published status for many products in one save.
- Catalogue managers archive products in bulk; archived products leave the shop but stay in the back office.
- Administrators suspend and reactivate customer accounts, with a reason.
- Administrators process customer requests to delete their data.
- The platform checks at start-up that no two product add-ons replace the same core function (proposed, to be confirmed).

**Rules**

- Each back-office area opens only for staff whose role allows it.
- A suspended customer cannot sign in; the reason is recorded.
- Scheduled job settings apply to the whole installation, not to one store.

**Benefit:** Staff run the shop day to day from one place.

### PRD-ADM-002 Workflow engine

| Key facts |  |
|---|---|
| Phase | Phase 1 |
| Pack | Always included |
| For | Staff (back office) |
| Availability | Depends on a pending decision: whether the workflow engine is built or an existing product is embedded (architecture decision) (ref WF-ENG) |

A visual tool to design business processes, such as approvals, as steps with branches and parallel paths. Processes can be tested, kept in versions and replayed, and are built from ready-made steps.

**Who uses it:** Client administrators; platform team; operations managers; auditors; e-government service administrators

**What it does**

- Design a process as steps, with branches where one path is chosen and parallel paths that run together.
- Use ready-made steps: approval, notification, document creation, payment release and a call to another system.
- Test a draft process with sample data and see where it would wait or block, without sending anything.
- Keep versions: cases already running finish on the version they started with.
- Replay how a past case moved through the steps, with times, people and decisions.
- Run KTDA internal approval stages, the shipping workflow and fulfilment processes as configured workflows.
- Give each e-government service its own configured process.
- Export and import processes in the BPMN 2.0 standard format.

**Rules**

- A process can be published only if every path reaches an end and every branch is complete.
- At a branch, the first true condition decides the path; otherwise the default path is taken.
- Process steps never change orders or payments directly; they ask the responsible part of the platform to act.
- If a call to another system fails after its retries, the case is marked failed and raised as an exception.
- The same start request never starts two cases (proposed, to be confirmed).

**Benefit:** Clients change their processes by configuration instead of new code.

### PRD-ADM-003 Business rules engine

| Key facts |  |
|---|---|
| Phase | Phase 1 |
| Pack | Always included |
| For | Staff (back office) |
| Availability | Planned for phase 1 |

A place to write and test business rules, for example "orders over a set amount need approval". It detects conflicting rules, sets which rule wins and records every change.

**Who uses it:** Client administrators; auditors

**What it does**

- Write rules as simple conditions and outcomes, without code.
- Start a rule from a library of ready-made patterns for eligibility, pricing, checks and routing.
- Test rules against sample data and see which inputs pass, which fail and why.
- Set which rule wins when several match: the highest priority only, or all in priority order.
- See a log of every time a rule was applied, with inputs, result, rule version and time.

**Rules**

- A rule with an error is refused, showing where the error is.
- A rule that conflicts with another cannot be switched on until the order of priority is set.
- Editing an active rule creates a new draft version; the active version stays in force until the new one is switched on.
- Personal or secret details are hidden in the rule log.
- Testing has no effect on live business.

**Benefit:** Business rules change without developers, and every decision can be audited.

### PRD-ADM-004 Transaction types and their required information

| Key facts |  |
|---|---|
| Phase | Phase 2 |
| Pack | Always included |
| For | Staff (back office) |
| Availability | Planned for phase 2 |

Defines the types of transaction the platform supports, such as fixed-price sale or request for quotation, and the information each type needs. Two types can be combined in one transaction.

**Who uses it:** Platform team; client administrators; operators

**What it does**

- The platform offers fixed-price sale, request for quotation, contract, group buying and scheme application as transaction types.
- Each type has its own required information, process, required documents and templates.
- Operators pick a type when starting a transaction, and the form, process and documents follow that type.
- Combine a request for quotation and a contract: an accepted quote creates a linked contract.

**Rules**

- A transaction cannot be created without its required information.
- Information fixed for a type cannot be changed on a single transaction.
- Any other change from the type's settings needs a reason and is recorded (proposed, to be confirmed).
- Auction and tender types are not offered.

**Benefit:** New ways of trading are set up by configuration.

### PRD-ADM-005 Eligibility and quota rules

| Key facts |  |
|---|---|
| Phase | Phase 2 |
| Pack | Always included |
| For | Staff (back office) |
| Availability | Planned for phase 2 |

Rules for who may see, buy or take part in something, reserved quotas, and screening against sanctions lists.

**Who uses it:** Programme staff; compliance staff

**What it does**

- Set rules that decide which customers may see products, categories and pages; membership updates when a profile changes and every night.
- Stop customers outside an eligible group from adding restricted products to the cart (proposed, to be confirmed).
- Reserve a quantity of a product for a defined group over a period.
- Screen customers against sanctions lists where the client's jurisdiction requires it, at registration and order.
- Review possible sanctions matches: clear them, or confirm them and block the customer (proposed, to be confirmed).

**Rules**

- Reserved quantities cannot be bought by customers outside the group.
- When two customers order the last reserved units at the same moment, only one succeeds (proposed, to be confirmed).
- A possible sanctions match blocks checkout until it is reviewed.

**Benefit:** Programmes with eligibility rules reach only the right customers.

### PRD-ADM-006 Approval queues

| Key facts |  |
|---|---|
| Phase | Phase 1 |
| Pack | Always included |
| For | Staff (back office) |
| Availability | Depends on a pending decision: whether the workflow engine is built or an existing product is embedded (architecture decision) (ref WF-ENG) |

Each approver sees a queue of items waiting for them. Approvals can have several steps or depend on conditions, can carry corrections to make, and rejections need a reason.

**Who uses it:** Approvers; client administrators; compliance staff; requesters

**What it does**

- Approvers see only items for their role, within their authority limit or delegated to them.
- Client administrators set up approvals with several steps, and steps that apply only under a condition, such as an amount above a threshold.
- Approvers approve subject to corrections; the approval takes effect only when the corrections are done and confirmed.
- Requesters see the reason for a rejection and their options: correct and resubmit, or appeal.
- High-risk actions, such as a seller changing the payout account, need approval with a full record.
- Client administrators set up moderation queues for product listings and seller applications, with a rule for sharing out the work.

**Rules**

- A rejection needs a reason.
- Nobody approves their own request, and one person decides at most one step of an item.
- A resubmitted item starts again at step one; earlier rounds are kept.
- An appeal goes to a different approver role; its outcome is final (proposed, to be confirmed).
- The old payout account stays in use until the change is approved.

**Benefit:** Approvals are fast, visible and traceable.

### PRD-ADM-007 Operations console and work queues

| Key facts |  |
|---|---|
| Phase | Phase 1 |
| Pack | Always included |
| For | Staff (back office) |
| Availability | Planned for phase 1 |

Work queues for operations staff, with a personal dashboard, saved views, unfinished work kept, keyboard shortcuts, a live count of active users, a mobile version and a Malawi Post operations view.

**Who uses it:** Operations staff; operators working away from a desk

**What it does**

- Switch between approval, exception, dispute and audit queues without losing your place.
- See orders grouped by stage (awaiting pickup, sorting, dispatch, out for last-mile delivery), with counts by branch or outlet (the Malawi Post operations view).
- Arrange a personal dashboard of queues, alerts and figures allowed for your role.
- Save common searches as named views.
- Recover unsaved work in a later session.
- Use keyboard shortcuts for open queue, approve, reject, comment, escalate and search.
- See how many customers are online now.
- Work queues on a tablet or phone.

**Rules**

- Queues and dashboard tiles show only what the user may see.
- Shortcuts apply the same permission checks and confirmations as buttons.
- Assignment and completion of work items are recorded for staff performance figures (proposed, to be confirmed).

**Benefit:** Operations staff work efficiently and no order is forgotten at any stage.

### PRD-ADM-008 Upload and content scanning controls

| Key facts |  |
|---|---|
| Phase | Phase 1 |
| Pack | Always included |
| For | Staff (back office) |
| Availability | Planned for phase 1 |

Controls which file types and sizes can be uploaded and scans uploads for viruses.

**Who uses it:** All users; client administrators

**What it does**

- Client administrators set allowed file types and maximum size for each place where files are uploaded.
- Every upload is scanned for viruses before it is stored.
- Administrators see all upload places and their limits on one page, including the picture library of the page editor, 3D product images and price-list imports.

**Rules**

- Files of a type not allowed, or too large, are refused before anything is stored.
- Where an older limit also applies, the stricter limit wins.
- A file whose content does not match its type is refused (proposed, to be confirmed).
- Infected files are refused and recorded.
- If the virus scanner is unavailable, uploads are refused by default (proposed, to be confirmed).

**Benefit:** Protects the system from harmful files.

### PRD-ADM-009 Exception management

| Key facts |  |
|---|---|
| Phase | Phase 2 |
| Pack | Always included |
| For | Staff (back office) |
| Availability | Planned for phase 2 |

A queue of problems such as failed checks, stuck orders and errors with other systems, ranked by severity, with reason codes, bulk actions, a record of each fix and detection of repeated causes.

**Who uses it:** Operations staff; operations managers

**What it does**

- See all problems in one queue, most severe and oldest first, narrowed by type, reason and area.
- Resolve a problem with a reason code and an action; the fix is recorded.
- Apply the same action (approve, reject, retry or escalate) to many problems at once, where that is safe.
- See problems with the same cause grouped together at the top of the queue.

**Rules**

- A reason code and an action are required to resolve a problem.
- Bulk actions are offered only where the problem type allows them.
- A retry that fails again reopens the problem (proposed, to be confirmed).

**Benefit:** Problems are fixed systematically, not ad hoc.

### PRD-ADM-010 Operational alerts

| Key facts |  |
|---|---|
| Phase | Phase 2 |
| Pack | Always included |
| For | Staff (back office) |
| Availability | Planned for phase 2 |

Alerts when something needs attention, for example orders stuck too long or service targets missed, with thresholds the client sets.

**Who uses it:** Operations managers; operators

**What it does**

- Set alert rules: what to watch, the threshold, who is told and on which channel.
- Get alerts for orders stuck too long, missed service targets or too many open problems.
- Acknowledge an alert; it shows who acknowledged and when (proposed, to be confirmed).

**Rules**

- An alert is not repeated for the same case until it clears or the repeat period passes.
- Alerts clear automatically when the measure falls back below the threshold (proposed, to be confirmed).
- Changes to alert rules are recorded (proposed, to be confirmed).

**Benefit:** Issues are caught early.

### PRD-ADM-011 Template library

| Key facts |  |
|---|---|
| Phase | Phase 2 |
| Pack | Always included |
| For | Staff (back office) |
| Availability | Planned for phase 2 |

A library of reusable transaction templates for each client, with versions, templates based on others, copying and approval before use. Includes one workspace for branding, wording, workflows, rules and templates.

**Who uses it:** Client administrators; template approvers

**What it does**

- Keep a private library of templates based on the industry defaults.
- Keep every version with author, time and summary, and restore an earlier version.
- Base a template on a parent and see which details are inherited and which are changed.
- Copy a template to start a new one.
- Reach branding, wording, workflows, rules, document and notification templates from one workspace.

**Rules**

- Editing a client template never changes the industry default.
- Changes to an active template need approval by someone other than the author; transactions keep using the current version until then.

**Benefit:** Repeat transactions are set up quickly and consistently.

### PRD-ADM-012 Template analytics and shared marketplace

| Key facts |  |
|---|---|
| Phase | Phase 3 |
| Pack | Commerce extensions pack (optional) |
| For | Staff (back office) |
| Availability | Planned for phase 3 |

Shows which templates are used most, and lets clients share templates with others in a common library.

**Who uses it:** Client administrators

**What it does**

- See for each template how often it was used, when it was last used and how many cases failed.
- See templates not used for a set period marked as stale.
- Publish a template to a shared library, with client details removed (proposed, to be confirmed).
- Adopt a template from the shared library as a draft in your own library.

**Rules**

- An adopted template needs approval before use.

**Benefit:** Good templates are reused across clients.

<!-- pagebreak -->

## 7.17 Documents and records

This part of the product creates, stores and protects the documents a client issues and receives. It produces invoices, receipts, packing lists, letters, certificates and export documents from templates, with the client's branding and a QR code for checking. It keeps every document with its versions, applies retention and legal hold, routes drafts through review and checks the documents applicants upload.

### PRD-DOC-001 Document generation

| Key facts |  |
|---|---|
| Phase | Phase 1 |
| Pack | Always included |
| For | Staff (back office) |
| Availability | Depends on a pending decision: which document and QR-code generation product is used (technical decision) (ref DOC-LIB) |

Creates invoices, receipts, letters, certificates and other documents from templates that fill in the details from the order or other record automatically.

**Who uses it:** Client staff (finance, sales, export); template designers; customers

**What it does**

- Template designers create and change a template for each document type, language and shop.
- Staff produce documents that fill in names, numbers, amounts and item lines from the record, with no retyping.
- Staff produce the same document as PDF, Word, image or web page; PDF is always available.
- The platform produces each document in the customer's language where a template exists, otherwise in the shop's default language; right-to-left languages are supported.
- Each document carries the client's logo, seal, the signing officer's designation and footer text, a watermark where a rule applies, and a QR code that leads to a page for checking the document.
- Every invoice and packing slip the platform prints, offers for download or attaches to an email uses the client's template, so there is one layout everywhere; a seller's print shows only that seller's items.
- Each document produced is stored automatically with the record it belongs to (PRD-DOC-002).

**Rules**

- A template cannot be saved if it refers to details the platform does not know.
- If a required detail has no value, the document is not created and staff are told which detail is missing.
- Proposed: where no active template exists for a document type, the platform's standard layout is used, to be confirmed.
- Proposed: letters and contracts drafted with AI help stay drafts, labelled as AI-generated, until a named person approves them; the approver is recorded, to be confirmed.

**Benefit:** Clients issue professional, consistent documents without manual work.

### PRD-DOC-002 Document storage

| Key facts |  |
|---|---|
| Phase | Phase 1 |
| Pack | Always included |
| For | Staff (back office) |
| Availability | Planned for phase 1 |

Keeps every document with all its versions, makes documents easy to find, applies retention rules and stops deletion while a legal matter is open.

**Who uses it:** Client staff; compliance staff; auditors; buyers; sellers

**What it does**

- The platform keeps each document with all its versions; earlier versions stay listed and can be downloaded.
- Staff search documents by type, number, owner, related record, language or date range.
- Staff search for words inside PDF, Word and text documents; scanned images become searchable only after their text has been read (PRD-DOC-005, PRD-AI-005).
- Compliance staff set how long each document type is kept; documents past their period are disposed of automatically.
- Compliance staff place a legal hold, with a reason, on one document, on all documents of a customer or order, or on a whole document type, and release it later.
- Buyers and sellers keep their own documents, such as tax certificates and licences, in a personal vault with an expiry date and reuse them in later applications.
- Shoppers see their invoices and vault documents in My account; sellers see theirs in the seller portal.
- Document owners receive an email when a vault document is about to expire.

**Rules**

- A document under legal hold cannot be deleted by any user or by the retention process.
- Placing and releasing a legal hold are recorded in the audit trail.
- A customer or seller can open only their own documents.
- Every upload passes the platform's upload checks (file type, size and virus scan) before it is stored.
- Proposed: a vault document past its expiry date is marked expired and is no longer accepted where a valid document is required, to be confirmed.

**Benefit:** Documents are safe, findable and kept exactly as long as required.

### PRD-DOC-003 Document integrity

| Key facts |  |
|---|---|
| Phase | Phase 2 |
| Pack | Always included |
| For | Staff (back office) |
| Availability | Planned for phase 2 |

Protects documents against tampering with digital fingerprints, digital signatures and watermarks, so anyone can check that a document is genuine.

**Who uses it:** Customers; auditors; client staff; compliance staff; any third party holding a document

**What it does**

- The platform records a digital fingerprint of every document version when it is stored.
- Staff, or a scheduled check, compare a stored document with its fingerprint; a mismatch alerts compliance staff by admin notice and email.
- Proposed: anyone who scans the QR code on a document sees its type, number, issue date, version and whether it is unchanged, with no personal data, to be confirmed.
- Document types marked for signing are signed digitally on the client's behalf by an external signing service; the signer, time and certificate are recorded.
- Staff check a digital signature and see whether it is valid, invalid or has an expired certificate.
- The platform applies watermarks automatically, for example "DRAFT" while a document is in review and "COPY" when staff download a final document again.

**Rules**

- Watermarks are added when a document is shown or downloaded; the stored original never changes.
- The signing service is not named in the source.

**Benefit:** Customers, auditors and third parties can trust that a document is genuine and unchanged.

### PRD-DOC-004 Document review and compliance export

| Key facts |  |
|---|---|
| Phase | Phase 2 |
| Pack | Always included |
| For | Staff (back office) |
| Availability | Planned for phase 2 |

Sends draft documents through review and approval before they become final, and exports sets of documents together for compliance checks.

**Who uses it:** Compliance staff; reviewers; document authors; auditors

**What it does**

- Draft documents of types that need review go to the reviewers named on the review chain.
- Reviewers add comments, approve, or reject with a reason; the author sees the reason and the document returns to draft.
- Reviewers and authors receive an admin notice when a draft is submitted, approved or rejected.
- Compliance staff and auditors select documents by type, owner, related record and date range and export them as one package.
- Each package holds the current versions, a list of the files with their details, the fingerprint of each file and the history of who opened or changed each document.

**Rules**

- A document becomes final only when the last reviewer approves; a final document is locked and can only be replaced by a new version.
- A document in review cannot be edited; the author must withdraw it first.
- Every reviewer action and every export is recorded in the audit trail.
- Proposed: an export package is deleted when its download period ends; the period is not stated, to be confirmed.

**Benefit:** Controlled documents are correct before issue, and audits are served quickly.

### PRD-DOC-005 Document requirements and validation

| Key facts |  |
|---|---|
| Phase | Phase 2 |
| Pack | Always included |
| For | Staff (back office) |
| Availability | Planned for phase 2 |

Defines which documents each process needs and checks uploaded documents at once for format, readable details, expiry and digital signatures.

**Who uses it:** Client administrators; applicants (buyers, sellers, citizens); client staff who review documents

**What it does**

- Administrators list, for each process such as a transaction type, seller onboarding or an e-government service application, the documents that are mandatory or optional, the allowed formats, the maximum size and whether a valid expiry date is needed.
- The platform refuses a submission that lacks a mandatory document and names the missing document.
- The platform checks each uploaded file at once for type, size and viruses, and refuses an expired document where a valid one is needed.
- Where a text-reading service is set up (PRD-AI-005), the platform reads the details from a scanned document and compares them with the applicant's profile, marking each as matching, not matching or unreadable.
- The platform checks digital signatures on uploaded files and stores the result with the document.
- Proposed: an applicant attaches a valid document from their vault instead of uploading it again, to be confirmed.
- Applicants and reviewers are told when a document is missing, expired or needs review.

**Rules**

- A document is never rejected automatically because details do not match or cannot be read; it goes to a staff member for review.
- Details read automatically are suggestions only; the reviewing staff member decides.
- A document with an invalid digital signature goes to manual review.
- Proposed: without a text-reading service, every document that passes the basic checks goes to manual review, and the reviewer records accepted or rejected with a reason, to be confirmed.

**Benefit:** Incomplete or wrong documents are caught at once, so applicants can fix them immediately.

### PRD-DOC-006 Export document set

| Key facts |  |
|---|---|
| Phase | Phase 1 |
| Pack | Business trade pack (optional) |
| For | Business buyers |
| Availability | Depends on a pending decision: which document and QR-code generation product is used (technical decision) (ref DOC-LIB) |

Produces the documents needed to export goods: commercial invoice, packing list, certificate of origin and the phytosanitary (plant health) certificate reference.

**Who uses it:** Export staff; international buyers

**What it does**

- Export staff produce the commercial invoice from the client template, with seller and buyer, the agreed delivery terms (Incoterm) and named place, currency, and item lines showing HS code, country of origin, duty note, quantity and value.
- Export staff produce the packing list from the shipment, with packages, quantities, net and gross weights and dimensions where recorded.
- Export staff produce the certificate of origin from the client template or, where an authority issues it, record its number, issuing body and date and attach the scanned certificate.
- Export staff record the phytosanitary certificate's reference number, issuing authority and issue date and attach the scan.
- Proposed: the export set shows which of the four documents are still missing, to be confirmed.
- Export staff receive an email when the export documents are ready.

**Rules**

- The platform does not issue the phytosanitary certificate; the competent authority issues it.
- All export documents are stored with the order (PRD-DOC-002).

**Benefit:** Exports clear customs without paperwork delays.

<!-- pagebreak -->

## 7.18 Security, audit and compliance

This part of the product protects the platform and the personal data it holds, and gives auditors and regulators the evidence they need. It covers encryption, protection against attacks, card-data rules, a tamper-proof audit trail, privacy and consent tools, country data-protection duties, breach handling and security testing. Most of it is always on for every client.

### PRD-SEC-001 Encryption and transport security

| Key facts |  |
|---|---|
| Phase | Phase 1 |
| Pack | Always included |
| For | Staff (back office) |
| Availability | Planned for phase 1 |

All traffic is encrypted, stored data is encrypted, passwords are stored in a form that cannot be read back, and card numbers are never stored.

**Who uses it:** All users; client administrators; finance staff

**What it does**

- The platform encrypts all traffic between the user's device and the shop and redirects any insecure address to the secure one.
- The platform uses secure connections when it contacts payment, SMS, delivery and registry services; an insecure address for such a service is refused when it is saved.
- Stored data, files and backups are encrypted, and this is checked and evidenced at go-live.
- The platform stores passwords in a scrambled, one-way form that no one can read back.
- The platform never stores card numbers: the current version of the platform has no place to keep card details at all.

**Rules**

- Encryption keys are unique to each client's installation and are never part of shared configuration.
- Configuration cannot switch password storage to a weaker form.
- Proposed: only TLS 1.2 or higher is accepted; the minimum version is not stated, to be confirmed.

**Benefit:** Customer data stays protected even if it is intercepted or storage is stolen.

### PRD-SEC-002 Edge protection

| Key facts |  |
|---|---|
| Phase | Phase 1 |
| Pack | Always included |
| For | Staff (back office) |
| Availability | Planned for phase 1 |

Protects the shop at the hosting level with a web application firewall and protection from floods of fake traffic (DDoS), and limits who can reach the back office and uploaded files.

**Who uses it:** Client administrators; shoppers; KTDA administrators

**What it does**

- Every public visit passes through the hosting provider's firewall and DDoS protection; the shop accepts traffic only from that service.
- Common hacking attempts, such as SQL injection and cross-site scripting, are blocked and logged.
- The platform records the visitor's real address, not the address of the protection service.
- For KTDA, the chosen cloud provider (AWS or Azure preferred) and region, the protection service and encryption are recorded at set-up.
- Administrators can limit the admin area to known addresses, and hidden traps block automated form spam.
- Proposed: files a shopper uploads with a product, at checkout or with a return are served only to that shopper, to staff handling orders and to the seller of the product, to be confirmed.

**Rules**

- Uploads of a file type outside the allowed list are refused by the platform's upload checks.
- Refused attempts to open someone else's file are recorded in the audit trail.

**Benefit:** The shop stays online and safe from common attacks.

### PRD-SEC-003 PCI-DSS scope control

| Key facts |  |
|---|---|
| Phase | Phase 1 |
| Pack | Always included |
| For | Staff (back office) |
| Availability | Planned for phase 1 |

Card payments happen on the bank's or payment provider's secure page, and only a reference comes back to the shop, so the shop never handles card numbers.

**Who uses it:** Finance staff; client administrators

**What it does**

- Shoppers enter card details only on the payment provider's secure page or in boxes the provider hosts.
- The platform keeps only the provider's reference and the last digits of the card.
- Before go-live, test card payments are made and the stored data and logs are scanned to prove no card number is kept.

**Rules**

- The platform never receives the card number or security code.
- A payment connection that collects card details on the shop's own pages is not accepted for card payments.

**Benefit:** The shop stays outside the most demanding card-security audits.

### PRD-SEC-004 Platform audit trail

| Key facts |  |
|---|---|
| Phase | Phase 1 |
| Pack | Always included |
| For | Staff (back office) |
| Availability | Planned for phase 1 |

A tamper-proof record of every important action: who did what, when, from where, with old and new values. It can be searched, exported and replayed to show how a record looked, and what each person could see, at any past moment.

**Who uses it:** Auditors; management; compliance staff; fraud staff; approvers

**What it does**

- The platform records every important change with the person (and the original staff member when acting for a customer), time, address, shop, record and old and new values.
- The trail also covers changes to settings and access rights, and staff views of customer records, orders and customer addresses.
- Auditors search by person, record type, record, shop, date range and amount, without technical skills.
- Auditors export search results with a signed summary that proves the export is complete and unchanged.
- Auditors replay how a record looked at any past moment and which roles and access a person had then.
- Compliance staff run reports of logins, failed logins, admin changes, setting changes and staff access to customer records.
- Changes to fraud rules, and high-risk actions together with their approval, are recorded and linked.
- A regular integrity check finds any altered, removed or reordered entry and alerts the security officer.

**Rules**

- No one, including administrators, can change or delete an audit entry.
- Passwords and secret values are never written to the trail; only the fact that they changed is recorded.
- Proposed: minor updates, such as last-active times, are not recorded, to be confirmed.
- Proposed: if an audit entry cannot be written, the change itself is not saved, to be confirmed.
- Proposed: audit entries are kept for a set period (not stated) and then archived with a signed checkpoint, to be confirmed.

**Benefit:** Every change is accounted for, giving full evidence for audits and investigations.

### PRD-SEC-005 Anomaly and correlation detection

| Key facts |  |
|---|---|
| Phase | Phase 2 |
| Pack | Always included |
| For | Staff (back office) |
| Availability | Planned for phase 2 |

Sends audit, sign-in and risk records to the client's security-monitoring system, which spots unusual patterns and links suspicious activity across the platform.

**Who uses it:** Security officers; fraud and security staff

**What it does**

- The platform sends audit records, sign-in records, risk flags and system errors to the security-monitoring system in batches, in order and without gaps.
- The monitoring system detects patterns such as bursts of failed logins or unusual approval times and raises alerts.
- Proposed: if the monitoring system cannot be reached, batches wait and are retried, and the security officer is alerted when the backlog grows too old, to be confirmed.

**Rules**

- Detection rules and alerts run in the client's monitoring system; the platform supplies complete records.

**Benefit:** Fraud and misuse that single checks would miss are found early.

### PRD-SEC-006 Data residency

| Key facts |  |
|---|---|
| Phase | Phase 1 |
| Pack | Always included |
| For | Staff (back office) |
| Availability | Depends on a pending decision: the hosting region and the rules for moving personal data across borders (both clients) (ref DP-01) |

Lets each client choose the country or region where its data is hosted.

**Who uses it:** Client administrators; regulators

**What it does**

- Once the client decides the region, stored data, files, backups and logs are created there and the region is recorded in the instance profile and hosting checklist.
- Backups are checked to be in the chosen region, or covered by a recorded cross-border transfer.
- Proposed: each connection that sends personal data to a service outside the region, such as SMS, email, security monitoring or the robot check, needs a transfer record (PRD-SEC-012) before go-live, to be confirmed.

**Rules**

- The go-live checklist fails while a required transfer record is missing.

**Benefit:** Clients meet data-location rules in data-protection law.

### PRD-SEC-007 Consent and privacy tools

| Key facts |  |
|---|---|
| Phase | Phase 1 |
| Pack | Always included |
| For | Staff (back office) |
| Availability | Planned for phase 1 |

Built-in tools for cookie consent, recording consent, and exporting or deleting a customer's data; country-specific duties are handled by the country data-protection pack (PRD-SEC-012).

**Who uses it:** Visitors; shoppers; client administrators; KTDA analytics users

**What it does**

- Visitors see a banner to accept all cookies, reject all except necessary ones, or choose by category; proposed categories are necessary, analytics, personalisation and marketing, to be confirmed.
- Visitors save or change their choice; it applies from the next page and is recorded with the banner version and time.
- Analytics and marketing tags run only when their category is accepted; personalised search and recommendations stop when personalisation is refused or withdrawn.
- Proposed: the chat assistant appears only after the visitor accepts the matching cookie category, to be confirmed.
- The platform records consent to the privacy policy at registration and newsletter sign-ups and unsubscribes.
- Registered shoppers export their personal data and request deletion from their account (PRD-IAM-017).
- The country pack switches on the privacy settings at go-live.

**Rules**

- Only necessary cookies are set before the visitor makes a choice.
- Automatic deletion of inactive customers stays off unless the country retention rule requires it.
- Analytics that sends purchase data directly from the platform stays off where the country profile requires consent for it, or has not stated the rule.

**Benefit:** Clients have basic privacy compliance from day one.

### PRD-SEC-008 Breach notification workflow

| Key facts |  |
|---|---|
| Phase | Phase 1 |
| Pack | Always included |
| For | Staff (back office) |
| Availability | Planned for phase 1 |

If personal data is leaked, helps identify who was affected and notify them and the regulator within the legal deadline.

**Who uses it:** Privacy officers; regulators; affected customers

**What it does**

- The privacy officer records a breach with discovery time, description, data types and systems involved.
- The platform works out the deadlines for the regulator and for affected people from the country profile.
- The officer produces the list of affected people and their contact channels from chosen criteria; the list is frozen with its count.
- The officer sends notices to affected people using prepared templates.
- The officer records the date, channel and reference of the regulator notice, which is submitted outside the platform.
- The platform alerts the officer as a deadline approaches and marks the case overdue when it passes.

**Rules**

- If a deadline is missing from the country profile, the case shows "not configured" and the officer is alerted; no default deadline is assumed.
- Proposed: a decision that a breach need not be notified, with its reason, must be confirmed by a second authorised person before the case closes, to be confirmed.

**Benefit:** Clients meet their legal breach-reporting duties.

### PRD-SEC-009 Compliance reports and certificates

| Key facts |  |
|---|---|
| Phase | Phase 2 |
| Pack | Always included |
| For | Staff (back office) |
| Availability | Planned for phase 2 |

Evidence packs for security and privacy frameworks (for example SOC 2 and ISO 27001 controls), and a signed statement of the integrity of the platform's records after an audit.

**Who uses it:** Compliance staff; auditors; certification bodies

**What it does**

- Compliance staff export evidence for a period: access audit report, multi-factor sign-in status, privileged accounts, audit trail checks, configuration change log, auditor access grants and the security scan results of each release.
- Each evidence file comes with a list of contents and can be loaded into the client's compliance management tool.
- After an audit, the platform produces a signed statement that the records of the audited period are complete and unchanged, for the auditor to countersign.

**Rules**

- Mapping evidence to controls is done in the compliance tool; the certification itself is obtained by the operating organisation.

**Benefit:** Auditors and certification bodies get the evidence they need directly from the system.

### PRD-SEC-010 Auditor read-only access

| Key facts |  |
|---|---|
| Phase | Phase 2 |
| Pack | Always included |
| For | Staff (back office) |
| Availability | Planned for phase 2 |

Gives auditors temporary read-only access and a way to search the audit records.

**Who uses it:** Auditors; client administrators

**What it does**

- Administrators grant an auditor access with a start date, end date, the shops covered and the period of records.
- Auditors view admin pages and search the audit trail without technical skills.
- Searches return only records of the granted period and shops.
- Every view and export by the auditor is itself recorded in the audit trail.

**Rules**

- Auditors cannot create, change or delete anything.
- Access stops at once when the end date passes, and the auditor is told the access has expired.

**Benefit:** Audits happen without any risk of changes to records.

### PRD-SEC-011 Vulnerability management

| Key facts |  |
|---|---|
| Phase | Phase 1 |
| Pack | Always included |
| For | Staff (back office) |
| Availability | Planned for phase 1 |

Scans the software and its components for known security weaknesses before each release and continuously on the running servers, and tracks penetration-test findings to closure.

**Who uses it:** Platform team; client administrators

**What it does**

- The software and its components are scanned for known weaknesses before every release.
- The running servers are scanned continuously; each finding gets a severity, an owner and a fix deadline.
- Findings of independent penetration tests are tracked until fixed with retest evidence, or until the risk is accepted by a named approver.
- Proposed: each penetration test covers every product extension and every known weakness of the base platform, to be confirmed.

**Rules**

- A release with a new high or critical weakness is not released.
- Fix deadlines per severity are not stated in the source.

**Benefit:** Fewer security holes reach the live system, and those found are fixed on time.

### PRD-SEC-012 Country data-protection pack

| Key facts |  |
|---|---|
| Phase | Phase 1 |
| Pack | Always included |
| For | Staff (back office) |
| Availability | Planned for phase 1 |

A privacy pack per country holding the legal settings and registers each client needs; expected to cover Kenya's Data Protection Act 2019 and Malawi's Data Protection Act 2024 (law names to be confirmed).

**Who uses it:** Privacy officers; client administrators; regulators; KTDA analytics users

**What it does**

- The privacy officer keeps one profile per country: law names, regulator, response time for data requests, breach deadlines, transfer conditions and consent texts per language.
- The profile also states whether personal data may go to outside AI and translation services and to which countries, SMS opt-out duties and which messages are essential, and consent texts for partner data sharing.
- The privacy officer keeps a register of processing: purpose, data types, people concerned, lawful basis, retention, recipients, transfers and systems, with versions and spreadsheet export.
- The privacy officer records cross-border transfers and links them to the processing and connections concerned.
- The privacy officer records privacy impact assessments with risks, measures, decision and a review date, and is reminded on that date.
- The platform sets a due date for each data request from the profile's response time and lists overdue requests.
- Analytics is registered with consent as its lawful basis and linked to the analytics cookie category.

**Rules**

- No legal value is built into the product; every value comes from configuration, and unset values show as "not configured".
- Proposed: the go-live checklist fails while a required profile value, processing record or transfer record is missing, to be confirmed.

**Benefit:** Each client meets its own country's privacy law without product changes.

### PRD-SEC-013 Bot protection

| Key facts |  |
|---|---|
| Phase | Phase 1 |
| Pack | Always included |
| For | Staff (back office) |
| Availability | Planned for phase 1 |

"I am not a robot" checks (CAPTCHA) on registration, login, contact, review and forgotten-password forms.

**Who uses it:** Client administrators; shoppers; visitors

**What it does**

- The platform asks visitors to pass an invisible or tick-box robot check on registration, login, contact, product review and forgotten-password forms.
- Administrators set the pass score for the invisible check for their client.
- Proposed: the same check applies before a sign-in code is sent to a mobile phone, to be confirmed.
- Proposed: the public tracking page and guest order lookup ask for the check after a set number of lookups (number not stated), to be confirmed.

**Rules**

- Submissions that fail the check are refused.
- Proposed: the robot-check provider is listed as a cross-border transfer in the privacy register, to be confirmed.

**Benefit:** Automated spam and fake accounts are stopped.

### PRD-SEC-014 Data classification and masking

| Key facts |  |
|---|---|
| Phase | Phase 2 |
| Pack | Always included |
| For | Staff (back office) |
| Availability | Depends on a pending decision: the hosting region and the rules for moving personal data across borders (both clients) (ref DP-01) |

Labels each item of data by sensitivity and hides sensitive values, for example showing only the last digits of a phone number, on screens, in exports and in logs.

**Who uses it:** Privacy officers; client staff; shoppers

**What it does**

- The privacy officer labels each item of data as Public, Internal, Confidential, Restricted, Personal or Financial and sets how it is hidden; changes are recorded.
- Staff see sensitive values hidden on admin screens unless their role allows them.
- Proposed: staff with the right permission reveal a hidden value, and each reveal is recorded, to be confirmed.
- Staff exports of customers and orders hide sensitive values; a customer's own personal-data export is complete.
- Logs and audit entries hide or remove classified values.
- Proposed: the customer 360-degree view (PRD-CRM-003) follows the same labels once this feature is on, to be confirmed.

**Rules**

- If hiding a value fails, the value is not shown at all.

**Benefit:** Staff see only the personal data they need.

### PRD-SEC-015 Security incident management

| Key facts |  |
|---|---|
| Phase | Phase 2 |
| Pack | Always included |
| For | Staff (back office) |
| Availability | Planned for phase 2 |

Supports recording security incidents with a response checklist, a timeline, the people involved and lessons learned, in the client's incident tool.

**Who uses it:** Security team; clients; regulators

**What it does**

- The security officer handles each incident in the client's external incident tool.
- The platform exports the audit records, sign-in records and system logs of a period, with a list of contents, as evidence for the incident.
- Proposed: an incident involving personal data opens a linked breach case (PRD-SEC-008), to be confirmed.

**Benefit:** Security incidents are handled quickly and consistently, with evidence for regulators and auditors.

<!-- pagebreak -->

## 7.19 Connections with other systems

This part of the product connects the shop securely to other systems: partner and mobile apps, finance and ERP systems, banks, postal systems, government systems and buyers' purchasing systems. It controls who may connect and how often, tells other systems automatically when something happens, and makes sure no data is lost when another system is down. Client-specific connections for Malawi Post (SAGE 200, PostGlobal, MANEPS) are built on the same shared framework.

### PRD-INT-001 Secure connection service for other systems and apps

| Key facts |  |
|---|---|
| Phase | Phase 1 |
| Pack | Always included |
| For | Staff (back office) |
| Availability | Depends on a pending decision: which connection product is used for other systems to read and update the catalogue (technical decision) (ref API-01); whether a licensed add-on is bought or the capability is built (technical and Product Owner decision) (ref PAID-STUB); which integration gateway product is used and who runs secure sign-in for partners (technical decision) (ref API-GW) |

A secure, documented connection that lets other systems and apps read and update products, customers, orders, shipments, payments and documents, with access keys, usage limits and numbered versions.

**Who uses it:** Client IT teams; partner system developers; mobile app developers; client administrators; government and Malawi Post system operators

**What it does**

- Partner systems and apps read and update products, customers, orders, shipments, payments and documents.
- Each connected system receives its own access with only the permissions it needs, limited to its shop.
- Systems sign in using recognised international security standards; partner users are linked to one customer account (proposed: linking method to be confirmed).
- Administrators set limits on how often each system may connect, so one system cannot overload the shop.
- A bank sends payment notices, which the platform passes to payment matching; a shipping system sends tracking updates; an ERP reads paid orders and updates product data.
- Mobile apps use the same connection and get the same prices, discounts, tax and orders as the website.
- Authorised government or Malawi Post systems receive the report data they are authorised for, through the connection or as batch files.
- An optional flexible query option returns only the information requested, under the same limits.

**Rules**

- A request outside a system's permissions is refused and recorded.
- All changes follow the same business rules as staff screens and are recorded in the audit trail.
- A payment notice never marks an order as paid by itself; payment matching decides.
- An old version keeps working for a notice period, with its retirement date announced; changes that would break existing connections come only in a new version, listed in a change log.
- Proposed: a retired version is refused, to be confirmed.

**Benefit:** The shop connects to mobile apps and partner systems without manual work.

### PRD-INT-002 Integration gateway

| Key facts |  |
|---|---|
| Phase | Phase 1 |
| Pack | Always included |
| For | Staff (back office) |
| Availability | Depends on a pending decision: which integration gateway product is used and who runs secure sign-in for partners (technical decision) (ref API-GW) |

A central gateway that manages all connections with outside systems: who may connect and how often, a register of connected systems, format conversion set up without code, a console, a developer portal and a test area for partners.

**Who uses it:** Client IT teams; client administrators; partner developers

**What it does**

- Outside systems reach the shop only through the gateway; outgoing connections to partners can also pass through it and be logged.
- Administrators use a console that lists each connection with its credential status and health (up or down, last error).
- Administrators keep a list of allowed partner applications and set usage limits and slow-down rules.
- The gateway blocks a partner that shows signs of abuse, such as repeated failed sign-ins, for a set period and alerts named staff.
- Partner developers read the documentation for each version in a developer portal and request access, which an administrator approves.
- IT staff keep a register of connected systems with owner, version, and test and live addresses, with history.
- IT staff set up conversion between data formats such as CSV and XML, with mapping done without code; records that cannot be converted are returned to the partner with the reason.
- Partners test in a separate test area with test data, without touching live data.

**Rules**

- Saved credentials are shown masked and are never part of shared configuration.
- Calls with invalid or expired sign-in details are refused before they reach the shop.
- Limit and abuse thresholds are not stated in the source.

**Benefit:** Integrations are secure, monitored and easy to add.

### PRD-INT-003 Automatic notifications to other systems

| Key facts |  |
|---|---|
| Phase | Phase 1 |
| Pack | Always included |
| For | Staff (back office) |
| Availability | Planned for phase 1 |

Sends automatic notifications to other systems when something happens, for example when an order is placed or a shipment is dispatched.

**Who uses it:** IT teams of connected systems; sellers; partners; client administrators

**What it does**

- Connected systems are told automatically when an order is placed or paid, and when a shipment is created, dispatched or delivered.
- Connected systems are told when an e-government service request is submitted.
- Sellers and partners subscribe to the updates they need; a subscription starts only after the receiving address confirms it (proposed, to be confirmed).
- Each seller receives only the order lines of their own items.
- Each notification carries a unique reference, its type, the time and a signature, so the receiver can check it is genuine and ignore duplicates.
- If the receiving system is down, the notification is retried; if it still fails, it is set aside, the owner and administrators are told, and it can be sent again (PRD-INT-004).
- Administrators switch the feature on or off per shop.

**Rules**

- Notifications are sent only to secure web addresses.
- Proposed: notifications carry identifiers, status, time and a link, and no other personal data, to be confirmed.
- Proposed: a subscription is paused after repeated failed deliveries and the owner is told, to be confirmed.

**Benefit:** Other systems react immediately without checking constantly.

### PRD-INT-004 Integration health and retries

| Key facts |  |
|---|---|
| Phase | Phase 1 |
| Pack | Always included |
| For | Staff (back office) |
| Availability | Planned for phase 1 |

Monitors connections with other systems, retries failed messages and keeps those that keep failing for investigation.

**Who uses it:** Client IT teams; administrators

**What it does**

- Administrators see, for each connection and period, the number of successes and failures, response time and volume.
- Named staff are alerted when response times or failure rates stay above set thresholds.
- Proposed: a connection with no successful exchange within its expected interval is shown as down and an alert is sent, to be confirmed.
- Messages that fail for a temporary reason are retried after set delays, up to a set number of attempts.
- Messages that still fail are set aside in a list showing every attempt and error, and administrators are told.
- Authorised staff resend or discard a set-aside message.

**Rules**

- A reason is required to resend or discard a set-aside message, and the action is recorded.
- Proposed: a message the receiving system rejects as wrong is set aside at once without retries, to be confirmed.
- Proposed: every part of the product that sends to outside systems uses the same retry and set-aside list, to be confirmed.
- Thresholds, delays and attempt numbers are not stated in the source.

**Benefit:** No data is lost when another system is temporarily down.

### PRD-INT-005 ERP and finance connector framework

| Key facts |  |
|---|---|
| Phase | Phase 1 |
| Pack | Always included |
| For | Staff (back office) |
| Availability | Depends on a pending decision: whether a licensed add-on is bought or the capability is built (technical and Product Owner decision) (ref PAID-STUB) |

A standard way to connect the shop to accounting or ERP systems to post sales and payments, keep products, customers and prices in step in both directions, and build new connections with a ready-made kit.

**Who uses it:** Finance staff; client administrators; IT; platform team

**What it does**

- The platform posts each paid order to the finance system with order number, lines, tax and totals, and stores the finance system's reference.
- Refunds are posted as credits that refer to the original sale.
- Proposed: the platform posts one summary per period and posting type instead of one per order, to be confirmed.
- Products, customers and prices are kept in step in both directions, with one system in charge of each type of data.
- Stock levels from the ERP are kept in step through PRD-INV-012.
- The platform team builds a new ERP connection from a template and a set of tests.
- Proposed: workflow steps call connected systems without new code, to be confirmed.
- KTDA's ERP connection is built on this framework once KTDA confirms its ERP and how it connects.

**Rules**

- A posting or record repeated with the same reference is not applied twice.
- A new ERP connection is accepted only when every test passes against the ERP's test system.
- Proposed: a posting the finance system rejects is listed as an exception with its reason, and the order is not changed, to be confirmed.
- Proposed: product details managed by the ERP are marked on the product page, and local changes to them are replaced at the next update, to be confirmed.

**Benefit:** Finance systems stay up to date automatically.

### PRD-INT-006 SAGE 200 adapter

| Key facts |  |
|---|---|
| Phase | Phase 1 |
| Pack | Malawi Post-specific connection |
| For | Staff (back office) |
| Availability | Planned for phase 1 |

Sends sales and payments to Malawi Post's SAGE 200 accounting system and reconciles them.

**Who uses it:** Malawi Post finance staff

**What it does**

- The platform posts summarised financial transactions to SAGE 200 for each period and posting type, as set out in the posting specification Malawi Post provides, and stores the SAGE reference.
- Finance staff are told when SAGE 200 rejects or does not confirm a batch; the batch is retried.
- The platform compares its totals per period and posting type with the totals in SAGE 200, read back or imported from a SAGE 200 file, and lists each difference.
- Finance staff resolve each difference with a note.

**Rules**

- A batch counts as posted only when SAGE 200 confirms it.
- A period is reconciled only when no difference remains open.
- Every resolution is recorded in the audit trail.

**Benefit:** Malawi Post's accounts match the shop.

### PRD-INT-007 PostGlobal adapter

| Key facts |  |
|---|---|
| Phase | Phase 1 |
| Pack | Malawi Post-specific connection |
| For | Staff (back office) |
| Availability | Planned for phase 1 |

Exchanges orders, shipments and tracking information with Malawi Post's PostGlobal postal system.

**Who uses it:** Malawi Post operations staff; customers; stakeholders

**What it does**

- The platform sends order and shipment details to PostGlobal at the hand-off point set out in the agreed specification, and stores the PostGlobal reference.
- The item or tracking number PostGlobal returns is stored on the shipment.
- PostGlobal is told once each time an order is placed or paid, or a shipment is created, shipped or delivered, with retries if it is down.
- PostGlobal status codes are translated into the platform's common tracking statuses.
- Customers and stakeholders see PostGlobal updates in the tracking timeline with status, time and location.

**Rules**

- A PostGlobal status with no translation is held back and no customer message is sent; staff reprocess it once the translation is added.
- The exact hand-off point is to be fixed with the PostGlobal specification.

**Benefit:** Online orders flow into postal operations without re-keying.

### PRD-INT-008 Banking integrations

| Key facts |  |
|---|---|
| Phase | Phase 1 |
| Pack | Commerce extensions pack (optional) |
| For | Staff (back office) |
| Availability | Planned for phase 1 |

Connects to banks for payments, statements and account checks.

**Who uses it:** Finance staff

**What it does**

- The platform connects to a bank to start payments, collect statements and make payouts, as the bank supports.
- Bank statements are collected automatically and passed to payment reconciliation (PRD-PAY-014).
- Where the bank offers it, the platform checks a seller's payout bank account and returns match or mismatch (PRD-SEL-005).
- Proposed: where the bank does not offer account checks, the seller's account is verified by other methods, to be confirmed.
- KTDA's bank connection is set up once KTDA confirms its bank and how it connects.

**Benefit:** Banking tasks are faster and automated.

### PRD-INT-009 Government system connector framework

| Key facts |  |
|---|---|
| Phase | Phase 1 |
| Pack | e-Government pack (optional) |
| For | Staff (back office) |
| Availability | Planned for phase 1 |

A standard way to connect to government systems and regulators, with approval before anything is sent.

**Who uses it:** Client administrators; approvers; government agencies; platform team

**What it does**

- Staff prepare submissions to regulators and oversight bodies, such as reports and complaint escalations.
- A prepared submission waits for approval and nothing is sent.
- A second authorised person approves it; it is then sent and the response stored.
- An approver declines a submission with a reason, and it is not sent.
- The platform team adds a new government system as an add-on that uses the same approval, retry and audit rules.

**Rules**

- Every approval is recorded in the audit trail.
- Proposed: the person who prepared a submission cannot approve it, to be confirmed.

**Benefit:** New government connections are added without rebuilding, and oversight duties are met under control.

### PRD-INT-010 Master data synchronisation

| Key facts |  |
|---|---|
| Phase | Phase 1 |
| Pack | Always included |
| For | Staff (back office) |
| Availability | Planned for phase 1 |

Keeps outlet lists, service catalogues and tariffs in step with the client's other systems.

**Who uses it:** Client administrators; client staff; IT

**What it does**

- Outlets from the client's source system are created or updated as pickup points.
- Service catalogue items are created or updated as service listings.
- Tariffs are loaded with their effective dates.
- Where the platform is in charge of a type of data, staff changes are sent to the other system and are not overwritten.
- Proposed: a record that fails checks is not applied, the others are, and the rejected record is reported with its reason, to be confirmed.

**Rules**

- An outlet removed at the source is closed, not deleted.
- Orders already placed keep the tariff in force when they were placed.
- Exchanges use secure connections and encrypted credentials; attempts with invalid credentials are refused and logged.

**Benefit:** There is one correct version of key reference data.

### PRD-INT-011 Add-on modules

| Key facts |  |
|---|---|
| Phase | Phase 1 |
| Pack | Always included |
| For | Staff (back office) |
| Availability | Planned for phase 1 |

New modules can be added as add-ons without changing the core system.

**Who uses it:** Platform team; client administrators

**What it does**

- Authorised administrators install a new module as an add-on; it works after a restart and no core part of the platform changes.
- Administrators limit an add-on to chosen shops and customer roles.
- New connections to other e-systems are added as add-ons on the government connector framework (PRD-INT-009), without changes to other modules.

**Rules**

- An add-on built for a different platform version is not loaded and is reported as incompatible.
- Proposed: configuration packs can set only known settings of an add-on and never secret values, to be confirmed.

**Benefit:** The product grows without risky changes to its core.

### PRD-INT-012 Punch-out

| Key facts |  |
|---|---|
| Phase | Phase 3 |
| Pack | Business trade pack (optional) |
| For | Business buyers |
| Availability | Planned for phase 3 |

Business buyers shop from inside their own purchasing system, and the cart returns to it for approval.

**Who uses it:** Business buyers; client administrators

**What it does**

- Administrators set up a punch-out connection for a buyer organisation with the common purchasing standard cXML, using a ready-made add-on; the SAP standard OCI is built only if a client needs it.
- The buyer opens the shop from their purchasing system and is signed in with their own work e-mail; organisation prices apply once that account is in the organisation's buyer group (to be confirmed).
- The buyer sends the cart back to the purchasing system for approval; no order is created in the shop at this point.
- If a client needs it, the platform also accepts the purchase order that the purchasing system sends later, creates the order and stores the purchase order number (to be built).

**Rules**

- A connection request with the wrong shared secret is refused and recorded.
- Proposed: a purchase order for an unknown or expired session is refused; the session time limit is not stated, to be confirmed.

**Benefit:** Large organisations buy within their own procurement rules.

### PRD-INT-013 MANEPS adapter

| Key facts |  |
|---|---|
| Phase | Phase 1 |
| Pack | Malawi Post-specific connection |
| For | Citizens and businesses (government services) |
| Availability | Depends on a pending decision: the purpose and data of the connection to MANEPS (Malawi Post to provide) (ref MG-09) |

Connects to Malawi's government e-procurement system (MANEPS).

**Who uses it:** Malawi Post administrators

**What it does**

- The platform exchanges the data defined for MANEPS through the government connector framework (PRD-INT-009), with its approval, retry and audit rules.
- Malawi Post states the purpose, data and connection details of the MANEPS link.
- Proposed: until those details are stated, nothing is sent to MANEPS and the connection shows as not configured, to be confirmed.

**Benefit:** Malawi Post's stated MANEPS connection is delivered on the shared framework.

<!-- pagebreak -->

## 7.20 Channels: mobile app, installable website, USSD, SMS, WhatsApp and assisted service

This part of the product lets customers reach the shop on the channel that suits them: mobile apps, an installable light website, USSD short codes, voice menus, SMS, WhatsApp, WeChat, Telegram, push notifications and in-person agents. It serves shoppers on basic phones and in low-connectivity areas as well as smartphone users. The platform's notification service decides what is sent; these channels deliver it.

### PRD-CHN-001 Native mobile apps

| Key facts |  |
|---|---|
| Phase | Phase 1 |
| Pack | Channels pack (optional) |
| For | Business buyers and shoppers |
| Availability | Depends on a pending decision: whether native mobile apps are a Malawi Post deliverable (Malawi Post to decide) (ref M-19); whether a licensed add-on is bought or the capability is built (technical and Product Owner decision) (ref PAID-STUB) |

Shop apps for Android and iPhone, whose home page, sliders, product carousels and menus are managed from the admin panel.

**Who uses it:** Shoppers; marketing staff; platform team

**What it does**

- Shoppers sign in, browse, fill a cart and order in the app with the same account, prices, discounts and tax as on the website.
- Orders placed in the app appear in My account on the website with the same status.
- Marketing staff change the app home page, sliders, product carousels and menus from the admin panel; shoppers see the change without a new app release.
- Proposed: the app offers only payment methods that support the app; the list is confirmed for each client before release, to be confirmed.

**Rules**

- The app works only through the platform's secure connection service (PRD-INT-001) and never reads stored data directly.
- Publishing the app in the app stores is a project service.

**Benefit:** Shoppers get a faster, app-based shopping experience.

### PRD-CHN-002 Installable website and low-bandwidth mode

| Key facts |  |
|---|---|
| Phase | Phase 1 |
| Pack | Always included |
| For | Business buyers and shoppers |
| Availability | Planned for phase 1 |

The website can be installed on a phone like an app, keeps working with a weak connection and offers light pages that use little data.

**Who uses it:** Shoppers in low-connectivity areas; shoppers with low-end phones; client administrators

**What it does**

- Shoppers install the website on their home screen and open it in one tap, with each shop's own name, icons and colours.
- In light mode, pages show smaller pictures and load pictures further down only when the shopper scrolls to them.
- When the connection drops, pages viewed before are shown with an offline notice; other pages show an offline page instead of a browser error.
- Offline, actions such as adding to cart, signing in or ordering are not sent and the shopper sees a message.
- Administrators switch the feature on or off per shop.

**Rules**

- Nothing is queued offline for sending later.
- Proposed: only public catalogue pages, information pages and design files are kept for offline use; account, cart, checkout and order pages never are, to be confirmed.
- Page-weight and load-time targets are not stated in the source; pages are measured once they are set.

**Benefit:** The shop works for customers with basic phones or expensive data.

### PRD-CHN-003 USSD channel

| Key facts |  |
|---|---|
| Phase | Phase 1 |
| Pack | Channels pack (optional) |
| For | Business buyers and shoppers |
| Availability | Planned for phase 1 |

Simple menus reached by dialling a short code (for example *123#) on any mobile phone to check orders, place simple orders or pay.

**Who uses it:** Shoppers on basic phones; client administrators

**What it does**

- Shoppers whose phone number is linked to their account dial the short code and see their recent orders with number and status.
- Proposed: callers whose number is not registered are told so and see no order data, to be confirmed.
- Proposed: shoppers pick a product from a short list, choose quantity and pickup or delivery to their saved address, confirm, and receive an order number; payment is pending until paid, to be confirmed.
- Shoppers pay for the order from their mobile-money wallet; the payment request goes to their phone (PRD-PAY-004).
- Administrators set up the menus in each language without code; new sessions use the new menu.

**Rules**

- If the session ends before the shopper confirms, no order is placed.
- An unknown order and another customer's order get the same reply.
- Requests are accepted only after the USSD gateway is verified.
- The USSD gateway operator is not named in the source.

**Benefit:** The shop reaches customers without smartphones or internet.

### PRD-CHN-004 Voice menus and automated calls (IVR)

| Key facts |  |
|---|---|
| Phase | Phase 2 |
| Pack | Channels pack (optional) |
| For | Business buyers and shoppers |
| Availability | Planned for phase 2 |

Automated phone menus in local languages, and automated voice calls for urgent notifications to customers who cannot use text.

**Who uses it:** Shoppers

**What it does**

- Callers choose a language, choose order status and key in an order number; the status is read out if the calling number belongs to the order's customer.
- Customers whose preferred channel is voice receive urgent notifications as automated calls in their language.
- The platform records whether each call was answered, not answered or failed.
- Proposed: if no recording exists in the customer's language, the call is skipped and the next channel is used, to be confirmed.

**Rules**

- An unknown order and another customer's order get the same "not found" reply.
- The voice platform is not named in the source.

**Benefit:** Customers who prefer voice, or cannot read well, are served.

### PRD-CHN-005 SMS gateway and SMS commands

| Key facts |  |
|---|---|
| Phase | Phase 1 |
| Pack | Always included |
| For | Business buyers and shoppers |
| Availability | Planned for phase 1 |

Connects to SMS providers to send text messages, and lets customers send simple text commands, for example to check an order.

**Who uses it:** Shoppers; client administrators; platform team

**What it does**

- The platform sends notifications and one-time sign-in codes by SMS through local providers and records whether each was delivered or failed.
- Messages that fail for a temporary reason are retried; proposed: a second provider is used if one is set up, to be confirmed.
- Shoppers text a command such as "STATUS" with an order number and get the order status back (keyword proposed, to be confirmed).
- Proposed: an unknown command gets a reply listing the available commands, to be confirmed.
- The platform team adds a new SMS provider by building one connector, with no change elsewhere; the connector also appears in the platform's own list of SMS providers.

**Rules**

- Order status is given only to the phone number of the order's customer; an unknown order and another customer's order get the same reply.
- The same message is never sent twice when a send is repeated.
- Command replies are not sent to numbers that have opted out.
- Incoming messages are processed only after the provider is verified.
- An overseas SMS service offered with the platform is used only if the client confirms it works and is allowed in Kenya or Malawi; local providers are the default.

**Benefit:** Customers on basic phones get updates without internet; Malawi Post asked for SMS notifications.

### PRD-CHN-006 WhatsApp Business

| Key facts |  |
|---|---|
| Phase | Phase 1 |
| Pack | Channels pack (optional) |
| For | Business buyers and shoppers |
| Availability | Planned for phase 1 |

Order updates, notifications and live chat on WhatsApp.

**Who uses it:** Shoppers; support agents; client administrators

**What it does**

- Shoppers who opted in receive order updates and notifications on WhatsApp, using message templates approved by WhatsApp; others receive them on their next channel.
- Shoppers send a WhatsApp message to the business number and are answered by the chat assistant (PRD-AI-003) where it is on, or by an agent in the live chat console (PRD-CRM-008) or as a support ticket.
- Agents and the chat assistant reply in the same WhatsApp conversation.
- Shoppers send images and documents, which are attached to the conversation after the upload checks.
- Proposed: when WhatsApp refuses a message, the agent sees the reason and the message is not shown as sent, to be confirmed.
- Administrators connect the client's own WhatsApp Business account, so messages come from its verified business name.

**Rules**

- Replies are not sent to people who have opted out.
- Account credentials are stored encrypted for each client and never included in configuration packs.
- Incoming messages are processed only after WhatsApp is verified as the sender.

**Benefit:** Customers get updates and help on a channel they already use; KTDA asked for WhatsApp Business chat.

### PRD-CHN-007 WeChat

| Key facts |  |
|---|---|
| Phase | Phase 1 |
| Pack | Channels pack (optional) |
| For | Business buyers and shoppers |
| Availability | Planned for phase 1 |

Chat with customers on WeChat.

**Who uses it:** International buyers; support agents; client administrators

**What it does**

- Administrators connect the client's WeChat official account; the account type and registration are not stated in the source.
- Buyers message the account and are answered in the live chat console (PRD-CRM-008) or through a support ticket; agents' replies reach the buyer on WeChat.
- Proposed: when WeChat refuses a message, the agent sees the reason, to be confirmed.

**Rules**

- Account credentials are stored encrypted and never included in configuration packs.
- Incoming messages are processed only after WeChat's signature is verified.

**Benefit:** The shop reaches Chinese buyers, relevant to KTDA's international market.

### PRD-CHN-008 Telegram bot

| Key facts |  |
|---|---|
| Phase | Phase 3 |
| Pack | Channels pack (optional) |
| For | Business buyers and shoppers |
| Availability | Planned for phase 3 |

A Telegram bot that gives order status and sends notifications to shoppers.

**Who uses it:** Shoppers

**What it does**

- Proposed: shoppers link their Telegram account using a one-time code shown in My account, to be confirmed.
- Linked shoppers ask the bot for the status of their recent orders; unlinked chats receive linking instructions.
- Shoppers who opted in receive their notifications through the bot.

**Benefit:** Telegram is available as an optional channel for shoppers who use it.

### PRD-CHN-009 Agent and correspondent networks

| Key facts |  |
|---|---|
| Phase | Phase 2 |
| Pack | Assisted service pack (optional) |
| For | Business buyers and shoppers |
| Availability | Planned for phase 2 |

Connects to networks of outlets, agents and banking agents who serve customers in person, and calculates their commission.

**Who uses it:** Agents; walk-in customers; client administrators; finance staff

**What it does**

- Administrators manage agent networks and add agents (accounts holding the Agent role, with outlets assigned) as members.
- Orders an agent places for a walk-in customer through assisted checkout (PRD-CHK-013) count for that agent, outlet and network.
- Proposed: commission is calculated when an agent's order is paid, using the network's commission rule and recording which rule version applied, to be confirmed.
- Proposed: refunds reverse the commission in proportion to the amount refunded, to be confirmed.
- Outside agent networks send their transactions through the connection service; each is matched to an agent by code, and unmatched ones are listed for follow-up.

**Rules**

- Proposed: a deactivated agent earns no new commission, and past commission is kept, to be confirmed.
- The commission basis and value are not stated in the source.

**Benefit:** The shop reaches areas without online shoppers, and agents are paid correctly.

### PRD-CHN-010 Agent mobile app for remote work

| Key facts |  |
|---|---|
| Phase | Phase 2 |
| Pack | Assisted service pack (optional) |
| For | Staff (back office) |
| Availability | Depends on a pending decision: whether postal operations, e-Government services and Malawi Post financial services are part of the product (Malawi Post to decide) (ref FG-06) |

A mobile app for agents working in remote areas that works offline, records location and supports verification.

**Who uses it:** Agents working in remote areas

**What it does**

- Agents capture records without a network and send them when back online.
- Each record is tagged with location and time when the agent allows location access.
- Proposed: a record captured without location access is saved and marked "no location", to be confirmed.
- Agents attach photos and complete the verification steps of a record; photos pass the upload checks.
- The same app also holds the scanning functions of PRD-TRK-003.

**Rules**

- Each record is applied once.
- Proposed: a record changed in the office since the agent downloaded it is shown to the agent as a conflict and never silently overwritten, to be confirmed.

**Benefit:** Agents can work in remote areas with poor or no connection.

### PRD-CHN-011 Social media integration

| Key facts |  |
|---|---|
| Phase | Phase 1 |
| Pack | Channels pack (optional) |
| For | Business buyers and shoppers |
| Availability | Planned for phase 1 |

Sign-up and sign-in with a social media account, share buttons and links to the client's social media pages.

**Who uses it:** Shoppers; marketing staff

**What it does**

- Shoppers sign up or sign in with their Facebook account; the platform links it to their existing account or creates a new one.
- Share buttons and links to the client's social media pages are set up with the marketing tools (PRD-MKT-010).

**Rules**

- The client's Facebook app secret is never included in configuration packs.

**Benefit:** Shoppers sign up more easily, and the client gains free promotion.

### PRD-CHN-012 SMS sender ID and opt-out

| Key facts |  |
|---|---|
| Phase | Phase 2 |
| Pack | Always included |
| For | Business buyers and shoppers |
| Availability | Planned for phase 2 |

Each client's SMS messages come from its own sender name, customers can reply STOP to opt out, and quiet hours are respected.

**Who uses it:** Shoppers; client administrators

**What it does**

- Every SMS carries the client's own sender name; if the provider rejects it, the message fails with the reason and administrators are alerted.
- Customers text an opt-out word (proposed: STOP, to be confirmed) to stop non-essential messages, and receive one confirmation.
- Customers text an opt-in word (proposed: START, to be confirmed) to receive messages again.
- Proposed: opt-outs from phone numbers without an account are also respected, to be confirmed.
- Non-urgent SMS that fall within quiet hours, set by the customer or the client, are held and sent when quiet hours end.

**Rules**

- Opt-outs and preferences are kept in one place, the customer's notification preferences.
- Proposed: one-time sign-in codes are sent at once, even in quiet hours, to be confirmed.
- Which messages are essential, and sent despite opt-out, is set in the country data-protection pack (PRD-SEC-012).

**Benefit:** SMS messaging is professional, lawful and respectful.

### PRD-CHN-013 Push notifications

| Key facts |  |
|---|---|
| Phase | Phase 2 |
| Pack | Channels pack (optional) |
| For | Business buyers and shoppers |
| Availability | Planned for phase 2 |

Notifications that pop up on the customer's phone from the app or the installed website.

**Who uses it:** Shoppers

**What it does**

- Shoppers allow notifications in the app or the installed website, and this is recorded as their opt-in.
- The platform delivers notifications to each of the shopper's devices and removes devices that can no longer receive them.
- Tapping a notification about an order opens that order's page, after sign-in if needed.
- Proposed: signing out on a device stops notifications to that device for the shopper, to be confirmed.

**Rules**

- Nothing is sent to a device unless the shopper has given permission.

**Benefit:** Customers notice timely updates.

<!-- pagebreak -->

## 7.21 AI capabilities

This part of the product adds artificial intelligence (AI) where a client asks for it and where it saves staff time. It includes an automated assistant for shoppers on the website and WhatsApp, help for staff and sellers with translation, listings and drafting, and connections to outside AI services for document checks, fraud scoring, recommendations, forecasting and photo inspection. All AI use follows one set of governance rules: people are told when AI is used, AI output is a suggestion until a person accepts it, and a person is always reachable.

### PRD-AI-001 AI translation

| Key facts |  |
|---|---|
| Phase | Phase 3 |
| Pack | Artificial intelligence pack (optional) |
| For | Business buyers and shoppers |
| Availability | Planned for phase 3 |

Automatic translation of product and site content into the languages the client uses. A person checks every translation before it is published.

**Who uses it:** Content staff; content managers

**What it does**

- Pre-fill translations of product, category, manufacturer and attribute texts for staff to check before saving.
- Use the same pre-fill for information pages, blog posts, news, menus, message templates, seller content and screen texts.
- Leave text that already exists in a language unchanged; only empty translations are filled.
- Keep translations that worked and show staff that some languages could not be translated when the translation service reports a problem.
- Proposed, to be confirmed: list missing screen texts for review; none is saved until an editor accepts it.
- Proposed, to be confirmed: an optional approval step per type of content, so a second person approves AI translations before shoppers see them.

**Rules**

- Nothing is saved until the editor saves it.
- Proposed, to be confirmed: when the approval step is on, shoppers keep seeing the current text until an authorised person approves the new translation; approvals and rejections are recorded.
- Proposed, to be confirmed: only the content needed for the translation is sent to the outside translation service; personal data is sent only where the AI use register and the country data-protection profile allow it.

**Benefit:** Multi-language content at lower cost, without losing human control over what is published.

### PRD-AI-002 AI listing assistance

| Key facts |  |
|---|---|
| Phase | Phase 3 |
| Pack | Artificial intelligence pack (optional) |
| For | Business buyers and shoppers |
| Availability | Planned for phase 3 |

Help for sellers and catalogue staff to write product descriptions and search-listing texts, suggest prices, check product details and create product images.

**Who uses it:** Sellers; catalogue staff

**What it does**

- Write a product description from the name, keywords and tone of voice the user gives; it is added to the product only when the user saves.
- Generate the search-listing title, keywords and description for products, categories, manufacturers, blog posts, news, information pages and sellers; only empty ones are filled.
- Proposed, to be confirmed: suggest a price from comparable products in the same category, region and season, showing how many products were compared and their price range.
- Proposed, to be confirmed: flag product details that look wrong or do not match each other, without blocking the save.
- Proposed, to be confirmed: create extra product images from the description, labelled "Generated with AI", for the seller to accept or discard.

**Rules**

- AI output is a suggestion: nothing changes on the product until the user accepts or saves it.
- Only users allowed to edit an item can use AI generation on it.
- Proposed, to be confirmed: if the AI service fails, the user is told that nothing has been changed and cannot save the failed result.
- Proposed, to be confirmed: no price is suggested when there are too few comparable products; the minimum number is not stated in the source.

**Benefit:** Better listings in less time.

### PRD-AI-003 AI chatbot

| Key facts |  |
|---|---|
| Phase | Phase 1 |
| Pack | Artificial intelligence pack (optional) |
| For | Business buyers and shoppers |
| Availability | Planned for phase 1 |

An automated assistant on the website and WhatsApp that answers common questions and order-status questions at any hour, and passes conversations to the support team when needed.

**Who uses it:** Shoppers; support agents; support staff; client administrators

**What it does**

- Answer common questions on the website chat and on WhatsApp using the approved ready-made answers kept by the support team.
- Proposed, to be confirmed: answer questions with no ready-made answer only from approved answers and published information pages; otherwise say it has no answer and offer a person.
- Proposed, to be confirmed: give a signed-in shopper the status of their own orders; on WhatsApp, only to the phone number of the customer who placed the order.
- Pass the conversation and its history to a live support agent when the shopper asks for a person or the assistant fails to answer a set number of times in a row.
- Record the question as a support ticket and tell the shopper the team will reply when no agent is available.
- Let client administrators set the channels, answer sources, languages and hand-off rules; changes are recorded.
- Proposed, to be confirmed: list the questions the assistant could not answer, with how often and when they were last asked, so staff can add approved answers.

**Rules**

- Every conversation starts by telling the shopper they are talking to an automated assistant and can ask for a person at any time.
- Draft or unapproved answers are never used.
- The assistant never states order, payment or account details it has not read from the platform records.
- Proposed, to be confirmed: "order not found" and "not your order" get the same reply, so order details are not revealed to others.
- If the AI service is unavailable or too slow, the assistant says so and offers a person.
- The number of failed answers before hand-off and the inactivity period that closes a conversation are client settings; defaults are not stated in the source.

**Benefit:** Shoppers get instant answers at any hour, and always reach a person when they need one.

### PRD-AI-004 AI drafting and summarisation

| Key facts |  |
|---|---|
| Phase | Phase 3 |
| Pack | Artificial intelligence pack (optional) |
| For | Business buyers and shoppers |
| Availability | Planned for phase 3 |

Drafts replies for support agents and summarises long documents for staff.

**Who uses it:** Support agents; client staff

**What it does**

- Proposed, to be confirmed: place a draft reply to a ticket in the reply box, based on similar resolved tickets and the knowledge base, labelled "Generated with AI".
- Summarise a long stored document with its key dates, requirements and obligations; the summary is labelled "Generated with AI" and kept with the document.

**Rules**

- Nothing is sent to a customer until the agent sends it.
- The original document is never changed by a summary.
- Only content needed for the task is sent to the outside AI service.

**Benefit:** Agents and staff work faster.

### PRD-AI-005 OCR and ID document checks

| Key facts |  |
|---|---|
| Phase | Phase 2 |
| Pack | Artificial intelligence pack (optional) |
| For | Business buyers and shoppers |
| Availability | Planned for phase 2 |

Reads text and details from scanned or photographed documents, and checks whether identity documents look genuine, using an outside service.

**Who uses it:** Compliance staff

**What it does**

- Proposed, to be confirmed: read the text and details of a scanned document and keep them with a confidence level; details below the set confidence level are marked for manual review.
- Proposed, to be confirmed: check an identity document and record the result as verified, not verified, inconclusive or unavailable, with the reasons.
- Proposed, to be confirmed: supply the details read from a document to the document checks of the platform, which decide whether they match or need manual review.
- Let staff confirm or reject each check result, with the reason recorded.

**Rules**

- The original file is never changed.
- A staff member takes the decision about a person; the service never decides alone.
- The confidence level for manual review is a client setting; the default is not stated in the source.
- The outside service is not named in the source.

**Benefit:** Faster, more reliable document checks.

### PRD-AI-006 ML fraud detection

| Key facts |  |
|---|---|
| Phase | Phase 3 |
| Pack | Artificial intelligence pack (optional) |
| For | Business buyers and shoppers |
| Availability | Planned for phase 3 |

A trained model, run by an outside service, that scores how likely a payment is to be fraud.

**Who uses it:** Fraud staff

**What it does**

- Proposed, to be confirmed: score a payment for fraud risk and return the score, the model version and the main reasons.
- Show fraud staff the score, model version and main reasons when they open a flagged payment.
- Proposed, to be confirmed: let payments continue under the other fraud rules when the scoring service does not answer in time; the missing score is recorded.

**Rules**

- The score is a suggestion: the payment risk rules decide whether to flag or block, using the threshold the client sets on those rules.
- Every score keeps its model version and main reasons, and the model has a bias report for each monitoring period.
- The outside service is not named in the source.

**Benefit:** Catches fraud patterns that simple rules miss.

### PRD-AI-007 ML recommendation engine

| Key facts |  |
|---|---|
| Phase | Phase 3 |
| Pack | Artificial intelligence pack (optional) |
| For | Business buyers and shoppers |
| Availability | Planned for phase 3 |

A trained model, run by an outside service, that produces the product suggestions shown in 'Personalised recommendations'.

**Who uses it:** Shoppers

**What it does**

- Proposed, to be confirmed: return ranked product suggestions for a shopper on the product page, the cart and the home page.
- Proposed, to be confirmed: take over as the source of personalised suggestions when installed; when removed, the platform uses its own fallback suggestions.
- Proposed, to be confirmed: send what consenting shoppers view, add to the cart and buy to the service under a pseudonymous key only, with no name, contact or address.
- Proposed, to be confirmed: ask the service to delete a shopper's data when they withdraw consent, and stop sending their data until they consent again.

**Rules**

- Only shoppers who have given personalisation consent are included.
- Products that may not be shown under the client's rules are removed before display.
- Every ranking keeps its model version, and the model has a bias report for each monitoring period.

**Benefit:** More relevant suggestions help shoppers find products faster.

### PRD-AI-008 Forecasting and image inspection

| Key facts |  |
|---|---|
| Phase | Phase 3 |
| Pack | Artificial intelligence pack (optional) |
| For | Business buyers and shoppers |
| Availability | Planned for phase 3 |

Predicts future demand and checks product quality from photos, using outside services.

**Who uses it:** Stock planners; quality staff

**What it does**

- Forecast demand by category, region and period from order history, and show the forecasts in reports with the run date.
- Proposed, to be confirmed: check product photos for defects and keep each finding with its confidence level.
- Let a staff member confirm or reject each defect finding.

**Rules**

- Forecasts change no stock or order.
- Defect findings are suggestions until a staff member confirms them.
- The outside services are not named in the source.

**Benefit:** Better stock planning and quality control.

### PRD-AI-009 AI contract and letter drafting

| Key facts |  |
|---|---|
| Phase | Phase 3 |
| Pack | Artificial intelligence pack (optional) |
| For | Business buyers and shoppers |
| Availability | Planned for phase 3 |

Drafts contracts and letters from a document template and the details a user enters.

**Who uses it:** Legal staff; sales staff

**What it does**

- Create a first draft of a contract or letter from a template and the details entered, labelled "Generated with AI".
- Let a person edit or approve the draft and then issue it through the normal document process.

**Rules**

- A draft is issued only after a person edits or approves it.
- Only the details needed for the draft are sent to the outside AI service.

**Benefit:** Faster document preparation.

### PRD-AI-010 AI governance

| Key facts |  |
|---|---|
| Phase | Phase 1 |
| Pack | Artificial intelligence pack (optional) |
| For | Business buyers and shoppers |
| Availability | Planned for phase 1 |

Tells users when AI is used, explains AI answers and decisions, lets users reach a person, and keeps a register of AI use with monitoring for unfair bias.

**Who uses it:** All users; shoppers; citizens; fraud staff; client administrators; regulators

**What it does**

- Start every assistant conversation by telling the user they are talking to an automated assistant.
- Label AI-generated content shown to customers as generated with AI.
- Proposed, to be confirmed: record each use of AI-generated or AI-translated content that a person accepted: feature, user, item, provider and time.
- Proposed, to be confirmed: tell a shopper which approved answers or information pages an assistant answer was based on.
- Show fraud staff the score, model version and main reasons when a model score affected a payment.
- Let a user ask for a person at any time during an assistant conversation.
- Proposed, to be confirmed: keep an AI use register listing each AI feature with its provider, the kinds of data sent, the disclosure text, the owner and the review date; features without an entry show as incomplete.
- Proposed, to be confirmed: link the bias report of each model that scores or ranks people for each monitoring period; a missing report shows as overdue.

**Rules**

- Every assistant conversation starts with the AI disclosure.
- Every AI-generated item shown to a customer carries the AI label.
- Every model that scores or ranks people keeps its version and main reasons for each result.

**Benefit:** Responsible, trustworthy use of AI that the client can show to users and regulators.

<!-- pagebreak -->

## 7.22 Financial products

This part of the product connects the shop to partner banks, lenders and insurers, so that buyers and sellers can reach credit, invoice discounting and insurance. It applies government or programme subsidies when eligible buyers purchase, and lets a client such as Malawi Post list financial and partner services such as agency banking, insurance, bill payment and ticketing. Lending decisions, credit scoring, policy issue and claim settlement stay with the partners; the platform shares data only with the customer's consent, shows offers, records what the partner reports and applies the effects on the platform.

### PRD-FIN-001 Credit marketplace

| Key facts |  |
|---|---|
| Phase | Phase 3 |
| Pack | Agri-finance and schemes pack (optional) |
| For | Business buyers and shoppers |
| Availability | Planned for phase 3 |

Partners such as banks offer loans to buyers or sellers on the platform, using platform data to judge eligibility, with repayment taken from sales.

**Who uses it:** Sellers; buyers; finance staff

**What it does**

- Finance staff register partner lenders and their loan products, the target audience (sellers or buyers) and the kinds of data each may receive.
- Sellers see loan offers on a Finance page in the seller portal, with the partner name, product name and the partner's description.
- Buyers see input-credit offers on product pages of linked categories and can apply in the same way.
- Before anything is shared, the customer sees the partner, the kinds of data and the purpose, and must agree; the agreement is recorded and the application is sent to the lender.
- Proposed, to be confirmed: customers can withdraw their agreement in My account; after that nothing more is sent to that partner and the partner is told.
- Loan decisions and status reported by the lender (approved, declined, paid out, closed) are recorded against the application and the seller is told.
- Repayments agreed with the lender are deducted from the seller's next platform settlement and shown on the seller statement with the lender reference; each deduction is reported to the lender.
- Proposed, to be confirmed: finance staff can suspend a repayment instruction with a reason, which stops deductions while it is suspended.

**Rules**

- The platform shows partner products as supplied; it calculates no credit score, rate, limit or decision of its own.
- No customer data is sent without recorded agreement for that partner, purpose and data scope, and only the agreed kinds of data are sent.
- Proposed, to be confirmed: a repayment deduction never exceeds the instructed amount, the outstanding loan balance or the settlement amount.
- Deductions stop when the loan is closed.
- Partner credentials are stored protected for each client and are never included in exports.

**Benefit:** Small businesses and buyers get access to finance, with repayment made simple.

### PRD-FIN-002 Invoice discounting

| Key facts |  |
|---|---|
| Phase | Phase 3 |
| Pack | Agri-finance and schemes pack (optional) |
| For | Business buyers and shoppers |
| Availability | Planned for phase 3 |

Sellers get paid early by selling unpaid invoices of business buyers to a partner lender at a discount.

**Who uses it:** Sellers; business buyers; finance staff

**What it does**

- Sellers see the unpaid on-account invoices they may offer, with amount, due date and buyer name.
- Sellers choose an invoice and a partner lender, agree to share the invoice data, and the invoice is offered to the lender.
- When the lender accepts, the invoice is recorded as assigned to the lender, who pays the seller early outside the platform.
- When the lender declines, the invoice becomes open again.
- The business buyer's statement shows the lender, and its payment details, as the party to pay for an assigned invoice.
- Proposed, to be confirmed: money the client receives for an assigned invoice is flagged and listed for finance staff to pass on to the lender; it is not paid out to the seller.
- When the lender reports that the buyer has paid, the invoice is recorded as settled.

**Rules**

- Proposed, to be confirmed: only an open, undisputed invoice that is not already offered or assigned can be offered.
- No invoice data is sent without the seller's recorded agreement.
- The platform makes no lending decision; decisions come only from the lender.

**Benefit:** Improves sellers' cash flow while making sure buyers pay the right party.

### PRD-FIN-003 Insurance

| Key facts |  |
|---|---|
| Phase | Phase 3 |
| Pack | Agri-finance and schemes pack (optional) |
| For | Business buyers and shoppers |
| Availability | Planned for phase 3 |

Offers insurance for goods in transit, equipment or crops from partner insurers, and lets policy holders make and follow claims.

**Who uses it:** Buyers; sellers; farmers; policy holders; finance staff

**What it does**

- Buyers can add transit insurance at checkout, with the premium and insurer name shown; the premium is added to the order total.
- After payment the insurer issues the policy, the policy number is recorded against the order and the buyer receives it.
- Sellers and farmers can buy equipment or crop insurance from a partner insurer through the partner services catalogue.
- Policy holders can open a claim with a description and at least one evidence file, and follow its status in My account until the insurer settles it.
- Proposed, to be confirmed: if the policy cannot be issued after the set number of retries, finance staff are alerted and a refund of the premium is requested.
- Proposed, to be confirmed: if an insured order is cancelled or fully refunded before dispatch, the policy is cancelled and the premium is refunded.

**Rules**

- The platform makes no underwriting or claim decision; claim money moves outside the platform.
- Proposed, to be confirmed: claims and their evidence are visible only to the policy holder, finance staff and administrators.
- No customer data is sent to an insurer without recorded agreement.

**Benefit:** Reduces risk for buyers, sellers and farmers.

### PRD-FIN-004 Subsidies and incentives

| Key facts |  |
|---|---|
| Phase | Phase 3 |
| Pack | Agri-finance and schemes pack (optional) |
| For | Citizens and businesses (government services) |
| Availability | Planned for phase 3 |

Shows buyers the government or programme subsidies they qualify for and applies them when they buy.

**Who uses it:** Farmers; eligible buyers; programme staff

**What it does**

- Programme staff define a subsidy scheme: eligible people, eligible products or categories, a fixed or percentage subsidy, start and end dates and a budget.
- Eligible buyers see the subsidy as a separate line, named after the scheme, and pay only their share; the order records the scheme and the amount.
- Customers apply for eligibility, which is checked against the programme registry; eligible customers are added to the scheme until the eligibility end date.
- Proposed, to be confirmed: eligibility ends automatically on its end date, after which no subsidy applies.
- Programme staff run a claim report per scheme and period listing each subsidised order line, with refunds shown as reversals, and export it so the programme funder can reimburse the client.

**Rules**

- Proposed, to be confirmed: a subsidy applies only while the customer is eligible, the scheme is within its dates and the remaining budget covers it.
- Proposed, to be confirmed: when the budget would be exceeded, no subsidy is applied and the buyer is told; two orders at the same time cannot overspend the budget.
- Proposed, to be confirmed: subsidy amounts on refunded or cancelled orders return to the scheme budget.
- The programme registry is not named in the source.

**Benefit:** Makes sure eligible people receive support, within the programme budget.

### PRD-FIN-005 Financial and partner services catalogue

| Key facts |  |
|---|---|
| Phase | Phase 1 |
| Pack | e-Government pack (optional) |
| For | Citizens and businesses (government services) |
| Availability | Depends on a pending decision: whether postal operations, e-Government services and Malawi Post financial services are part of the product (Malawi Post to decide) (ref FG-06); content that Malawi Post has not yet provided (service lists, return shipping models, priority e-Government services and the complaints and dispute policy) (ref T-MISS) |

A catalogue of financial and partner services such as agency banking, insurance, bill payment and ticketing, so the post-office network becomes a one-stop service point.

**Who uses it:** Malawi Post customers; client administrators; finance staff

**What it does**

- Customers browse or search partner services and see each service's name, partner, description and fee or price where one applies.
- Client administrators add each partner service with how it is delivered: information only, hand-off to the partner, or connected to the partner's system.
- For information-only services, customers see the description and partner contact but cannot buy.
- Proposed, to be confirmed: for hand-off services, customers continue to the partner's website and the referral is recorded.
- For connected services, customers enter their account reference (for example for a bill), which the partner checks before payment; after payment the partner confirms and the receipt reference is shown to the customer.
- Proposed, to be confirmed: if a connected service cannot be completed after the set number of retries, finance staff are alerted and a refund is requested.
- Client administrators switch each partner service on or off for each store without code.

**Rules**

- Partner services are ordinary catalogue items: fees, store availability and publishing work as for any product.
- Proposed, to be confirmed: ticketing services are offered for sale only once service vouchers and e-tickets (PRD-SVC-009) are available, because no e-ticket can be issued before then.
- Partner credentials are stored protected for each client and are never included in exports.

**Benefit:** Turns the post-office network into a one-stop service point.

<!-- pagebreak -->

## 7.23 e-Government and service catalogue (optional pack)

This optional part of the product lets a client such as Malawi Post offer government services through the shop. Each government agency lists its services with fees, required documents, process and delivery options. Citizens apply online, upload documents, pay the fee, book an appointment where a visit is needed, follow the status, and receive the issued document by delivery or collection through the post-office network. Agencies manage their own users and service processes, and the client collects government fees and reports what it owes and has passed on to each agency.

### PRD-EGV-001 e-Government service catalogue

| Key facts |  |
|---|---|
| Phase | Phase 1 |
| Pack | e-Government pack (optional) |
| For | Citizens and businesses (government services) |
| Availability | Depends on a pending decision: whether postal operations, e-Government services and Malawi Post financial services are part of the product (Malawi Post to decide) (ref FG-06); content that Malawi Post has not yet provided (service lists, return shipping models, priority e-Government services and the complaints and dispute policy) (ref T-MISS) |

A list of government services available through the platform, with fees, required documents, process and search, grouped by agency.

**Who uses it:** Citizens; agency administrators; client administrators

**What it does**

- Citizens search for a government service by a word in its name or description and narrow the results by agency.
- Citizens open a service and see the fee, the required documents with allowed file types, the process, the agency and the delivery options (delivery, collection at an outlet, or none).
- Agency administrators create and change a service with its description, fee, process and required documents, without a developer.
- Services created by an agency user belong to that agency and appear in its group automatically; users of other agencies cannot see them in administration.
- Unpublished services are not listed and cannot be applied for.

**Rules**

- A fee change applies only to new applications; existing applications keep the fee they were made with.
- A change to required documents applies only to new applications; submitted applications keep the documents they were submitted with.
- Proposed, to be confirmed: a service cannot be applied for until a published workflow is assigned to it.

**Benefit:** Citizens find government services in one place and know what they need before they apply.

### PRD-EGV-002 Service applications

| Key facts |  |
|---|---|
| Phase | Phase 1 |
| Pack | e-Government pack (optional) |
| For | Citizens and businesses (government services) |
| Availability | Depends on a pending decision: whether postal operations, e-Government services and Malawi Post financial services are part of the product (Malawi Post to decide) (ref FG-06); whether the workflow engine is built or an existing product is embedded (architecture decision) (ref WF-ENG); content that Malawi Post has not yet provided (service lists, return shipping models, priority e-Government services and the complaints and dispute policy) (ref T-MISS) |

Citizens apply for a government service online, upload and check documents, pay the fee and follow the status, while agency officers review and decide.

**Who uses it:** Citizens; agency officers; agency administrators

**What it does**

- Citizens apply, upload every required document and pay the fee in one flow; a service cannot be added without all required documents.
- Uploaded files are checked for type and size before they are stored, and only the citizen, users of the owning agency and administrators can open them.
- Once the fee is paid the application goes to the agency for review; if the order is cancelled before payment the application is cancelled.
- Officers accept or reject each document; a rejected document with a reason asks the citizen for a replacement, and the citizen uploads it on the application page.
- Officers approve the application only when every required document is accepted, or reject it with a reason (proposed, to be confirmed: the fee is refunded on rejection where the client has switched this on for the service).
- Officers record the issued document reference; the application then closes, or moves to delivery if there is a physical document.
- Citizens follow the status, dates, reasons and any appointment or delivery tracking in My account, and are told whenever the status changes.
- Each service follows its own workflow configured by the agency, without code.

**Rules**

- An application leaves the "awaiting fee" stage only when the payment is confirmed.
- Proposed, to be confirmed: every decision on a document or application records who, when and why; a reason is required for rejection and resubmission requests.
- Proposed, to be confirmed: an application can be approved only when every required document is accepted and every workflow step before approval is complete.
- Proposed, to be confirmed: if two officers act on the same application at once, the second change is refused and the officer reloads it.

**Benefit:** Fewer trips to government offices, and only complete, valid applications are approved.

### PRD-EGV-003 Appointments

| Key facts |  |
|---|---|
| Phase | Phase 1 |
| Pack | e-Government pack (optional) |
| For | Citizens and businesses (government services) |
| Availability | Depends on a pending decision: whether postal operations, e-Government services and Malawi Post financial services are part of the product (Malawi Post to decide) (ref FG-06); content that Malawi Post has not yet provided (service lists, return shipping models, priority e-Government services and the complaints and dispute policy) (ref T-MISS) |

Citizens book an appointment at an outlet for any step of their application that must be done in person.

**Who uses it:** Citizens; outlet staff

**What it does**

- When an application reaches a step that needs a visit, citizens see the free time slots at the outlets that handle the service and book one; the appointment is shown on the application.
- Full time slots cannot be booked.
- Proposed, to be confirmed: citizens are told when no time slot is free, and the application waits at its step.
- Proposed, to be confirmed: citizens can change or cancel an appointment before it starts.
- Citizens receive a confirmation of each booking, change or cancellation with the date, time, outlet address and application reference, and a reminder before the appointment.
- Outlet staff check the citizen in on arrival; the time and staff member are recorded on the application.

**Rules**

- Each appointment is linked to one application; a change releases the old time slot and books a new one.
- Time-slot capacity is enforced, so an outlet is never overbooked.
- The reminder lead time is a setting; the default is not stated in the source.

**Benefit:** Less queuing for citizens and a clear record that in-person steps were done.

### PRD-EGV-004 Document delivery

| Key facts |  |
|---|---|
| Phase | Phase 1 |
| Pack | e-Government pack (optional) |
| For | Citizens and businesses (government services) |
| Availability | Depends on a pending decision: whether postal operations, e-Government services and Malawi Post financial services are part of the product (Malawi Post to decide) (ref FG-06); content that Malawi Post has not yet provided (service lists, return shipping models, priority e-Government services and the complaints and dispute policy) (ref T-MISS) |

Issued documents such as certificates or IDs are delivered to the citizen or collected at a post office through the post-office network.

**Who uses it:** Citizens; agency officers; outlet staff; Malawi Post

**What it does**

- Citizens choose delivery to their address or collection at an allowed post office when they apply, with the delivery fee shown.
- Officers hand the issued document to the delivery network from the application, without re-entering data; a tracking number is assigned and the hand-over is recorded.
- Citizens track the document in the application or the order until it is delivered or ready for collection.
- Outlet staff mark the document ready for collection, and the citizen is told.
- Proposed, to be confirmed: staff confirm delivery or collection after the identity check the service requires; the check is recorded and the application closes.

**Rules**

- Proposed, to be confirmed: a document can be handed to delivery only after the application is marked issued.

**Benefit:** Citizens receive official documents near home.

### PRD-EGV-005 Government fee collection

| Key facts |  |
|---|---|
| Phase | Phase 1 |
| Pack | e-Government pack (optional) |
| For | Citizens and businesses (government services) |
| Availability | Depends on a pending decision: whether postal operations, e-Government services and Malawi Post financial services are part of the product (Malawi Post to decide) (ref FG-06); content that Malawi Post has not yet provided (service lists, return shipping models, priority e-Government services and the complaints and dispute policy) (ref T-MISS) |

Collects government fees and reports what is owed and passed on to each agency.

**Who uses it:** Finance staff; agency administrators; government agencies and their systems

**What it does**

- Each paid government fee creates an amount owed to the agency, excluding delivery fees.
- Agencies with a connection are told when a fee is paid for one of their services; failed notices are retried and listed for finance staff.
- Finance staff group amounts owed per agency for a period into a batch, record the payment reference and date, and record the agency's confirmation; batch changes are recorded.
- A fee refunded before batching is removed from what is owed.
- Proposed, to be confirmed: a fee refunded after it was passed on creates a recovery amount in the next batch.
- Reports list collected, refunded, passed-on and outstanding amounts per service and application in the format each agency requires, and can be sent to the agency.

**Rules**

- Batches and reports are per agency; agency users see only their own agency.
- Agency connection credentials are stored protected and are never included in exports.

**Benefit:** Correct, transparent collection of government revenue that agencies can reconcile.

### PRD-EGV-006 Agency administration

| Key facts |  |
|---|---|
| Phase | Phase 1 |
| Pack | e-Government pack (optional) |
| For | Citizens and businesses (government services) |
| Availability | Depends on a pending decision: whether postal operations, e-Government services and Malawi Post financial services are part of the product (Malawi Post to decide) (ref FG-06); content that Malawi Post has not yet provided (service lists, return shipping models, priority e-Government services and the complaints and dispute policy) (ref T-MISS) |

Each government agency manages its own users, their roles and the process each of its services follows.

**Who uses it:** Client administrators; agency administrators; agency officers

**What it does**

- Client administrators create an agency with its first agency administrator and its service group.
- Agency administrators add, deactivate and give roles (agency officer or agency administrator) to users of their own agency only; changes are recorded.
- Deactivated agency users cannot sign in.
- Agency officers can view services but not change them.
- Agency administrators assign the workflow, and its version, that each of their services follows.

**Rules**

- Agency users are limited to their own agency; an attempt to change a user of another agency, or to give any other role, is refused.
- Applications already submitted keep the workflow version they started with.

**Benefit:** Agencies run their own services on the platform, with the right people doing the right work.

### PRD-EGV-007 Digital ID service workflows

| Key facts |  |
|---|---|
| Phase | Phase 1 |
| Pack | e-Government pack (optional) |
| For | Citizens and businesses (government services) |
| Availability | Depends on a pending decision: whether postal operations, e-Government services and Malawi Post financial services are part of the product (Malawi Post to decide) (ref FG-06); whether the workflow engine is built or an existing product is embedded (architecture decision) (ref WF-ENG); content that Malawi Post has not yet provided (service lists, return shipping models, priority e-Government services and the complaints and dispute policy) (ref T-MISS) |

Configurable application processes for ID and official documents, set up without service-specific code.

**Who uses it:** Agency administrators; agency officers; citizens

**What it does**

- Agency administrators set up an identity or official-document service by configuration only: the service entry, required documents and workflow.
- Citizens apply for an ID or official document through the same application flow as any other service: documents, fee, review, decision, issue and delivery.
- Proposed, to be confirmed: workflow steps can check or register data in the national identity system; the result (verified, not verified, inconclusive or unavailable) is recorded, and any result other than verified stops the step and alerts the officer.

**Rules**

- No code is specific to one government service; services differ only by their catalogue details, documents, workflow and connection settings.
- An identity service is set up only if it is in the priority service list the client provides.
- The national identity systems are not named in the source.

**Benefit:** New document services are set up quickly, without a software release.

<!-- pagebreak -->

## 7.24 Services commerce (booking, delivery and completion of services)

This part of the product lets the shop sell services the way they are really delivered. Services can be priced by time, by unit or by quote, delivered by named providers and resources, booked at the customer's site, at an outlet or remotely, and paid in full, by deposit or later. Each service order moves through clear stages to a customer sign-off that releases payment to the provider or starts a refund, and is tracked against service-level targets. The module also covers vouchers and e-tickets, reminders and feedback, service reports, electronically delivered items (downloads) and the hire of items for a period.

### PRD-SVC-001 Service pricing models

| Key facts |  |
|---|---|
| Phase | Phase 2 |
| Pack | Services and bookings pack (optional) |
| For | Business buyers and shoppers |
| Availability | Depends on a pending decision: acceptance by the Product Owner of features recommended without a client source (ref PO-REC-v8) |

Services can be priced the way they are really sold: a fixed price, a price per hour, day or week, a price per unit (for example per hectare or per parcel), a 'from' price, or 'price on request' leading to a quote.

**Who uses it:** Service providers; shoppers; business buyers

**What it does**

- Sell a service at a fixed price, bought like any item.
- Price a service per hour, day or week, so the customer pays for the time booked.
- Proposed, to be confirmed: price a service per unit, with the unit (for example "per hectare") shown next to the price and on the quantity box.
- Set a minimum and maximum number of units; quantities outside them are refused.
- Show a "from" price, the lowest possible price, when the final price depends on the options chosen.
- Proposed, to be confirmed: mark a service "price on request", which hides the price and replaces the buy button with "Request a quote"; the customer then orders at the quoted price once the quote is accepted.

**Rules**

- The line total is the unit price times the quantity.
- Proposed, to be confirmed: for time-based pricing, the quantity is the number of whole hours, days or weeks covered by the booked slot, rounded up.
- A "price on request" service cannot be added to the cart directly; only an accepted quote leads to an order.

**Benefit:** Each service is charged the way it is delivered: by time, by unit, or by quote.

### PRD-SVC-002 Service providers and resources

| Key facts |  |
|---|---|
| Phase | Phase 2 |
| Pack | Services and bookings pack (optional) |
| For | Sellers and staff (back office) |
| Availability | Planned for phase 2 |

Records who or what delivers each service (staff, teams, equipment or vehicles) with their qualifications, working hours, the area they cover and how many bookings they can take per time slot.

**Who uses it:** Service providers; client operations staff; client administrators

**What it does**

- Service providers record each resource (staff, team, equipment or vehicle) with a name, the services it delivers and its capacity per time slot.
- Record qualifications and certifications with expiry dates, and which services need them.
- Set working hours, closure dates and the areas each resource covers.
- Offer customers only time slots in which a qualified, free resource covering the place has capacity.
- Update future time slots when working hours, closures or capacity change.
- Proposed, to be confirmed: when a qualification expires, mark the resource as not qualified, list its future bookings for reassignment and tell the provider.
- Proposed, to be confirmed: when reduced capacity conflicts with confirmed bookings, list those bookings for the provider to rebook instead of cancelling them.
- Proposed, to be confirmed: limit resource records to sellers in the service-provider category.

**Rules**

- A resource counts as available only if it is active, linked to the service, holds every valid qualification the service needs, works in that time slot, covers the location and has capacity left.
- Providers see and change only their own resources.

**Benefit:** Bookings are only accepted when someone is actually free and qualified to deliver them.

### PRD-SVC-003 Booking changes, cancellations and no-shows

| Key facts |  |
|---|---|
| Phase | Phase 2 |
| Pack | Services and bookings pack (optional) |
| For | Business buyers and shoppers |
| Availability | Depends on a pending decision: whether postal operations, e-Government services and Malawi Post financial services are part of the product (Malawi Post to decide) (ref FG-06); acceptance by the Product Owner of features recommended without a client source (ref PO-REC-v8) |

Customers can reschedule or cancel a booking within the rules the client sets; no-shows by the customer or the provider are recorded and handled by policy.

**Who uses it:** Shoppers; service providers; client operations staff

**What it does**

- Operations staff set per service a free-change period, a fixed or percentage cancellation fee after it, and a maximum number of reschedules.
- Shoppers move a booking to another free time slot within the rules, and receive a confirmation.
- Shoppers cancel a booking and see any fee and the refund amount before they confirm.
- Inside the free-change period, a cancellation gives a full refund of the amount paid.
- Providers record a customer no-show after the start time and grace period have passed; the no-show policy applies.
- When operations staff confirm that a provider did not turn up, the shopper gets a full refund and an offer to rebook without a fee.
- Proposed, to be confirmed: when a provider cancels with a reason, the shopper gets a full refund and is told.

**Rules**

- Rescheduling is refused once the free-change period has passed or the maximum number of reschedules is reached.
- The refund on cancellation is the amount paid minus the cancellation fee, never below zero.
- No refund is given for a customer no-show unless the policy says so.
- Proposed, to be confirmed: policies are kept in versions with an effective date; a booking keeps the rules in force when it was made.

**Benefit:** Fair, predictable rules for changes protect both customers and providers.

### PRD-SVC-004 Deposits and advance payment for bookings

| Key facts |  |
|---|---|
| Phase | Phase 2 |
| Pack | Services and bookings pack (optional) |
| For | Business buyers and shoppers |
| Availability | Depends on a pending decision: whether postal operations, e-Government services and Malawi Post financial services are part of the product (Malawi Post to decide) (ref FG-06); acceptance by the Product Owner of features recommended without a client source (ref PO-REC-v8) |

A booking can require full payment, a deposit or no payment upfront; the balance is collected later, and deposits are refunded or kept according to the cancellation policy.

**Who uses it:** Shoppers; service providers; client operations staff; finance staff; outlet staff

**What it does**

- Operations staff set per service whether a booking needs full payment, a deposit (fixed or percentage) or no payment upfront, and when the balance is due (before the start or at completion).
- Shoppers pay the deposit when they book and the balance later.
- Proposed, to be confirmed: shoppers pay the balance online from My account as a separate payment linked to the booking.
- Shoppers can pay the balance at an outlet, where outlet staff take the payment for the booking.
- When a booking with a paid deposit is cancelled, the refundable share is refunded and the rest is kept, as the cancellation policy says.
- Proposed, to be confirmed: when the balance is overdue, the shopper is reminded or the booking is cancelled, as the service rule says.

**Rules**

- Proposed, to be confirmed: the deposit and the balance are paid as separate orders linked to the booking; the booking is fully paid when both are paid.
- Proposed, to be confirmed: an order is not placed if the amount charged for a booking does not match the amount due under its payment rule.
- The action taken on an overdue balance is a setting; the default is not stated in the source.

**Benefit:** Reduces no-shows and protects providers' time.

### PRD-SVC-005 Service order lifecycle and completion sign-off

| Key facts |  |
|---|---|
| Phase | Phase 1 |
| Pack | Services and bookings pack (optional) |
| For | Business buyers and shoppers |
| Availability | Planned for phase 1 |

A service order moves through clear stages (requested, confirmed, scheduled, in progress, completed) and the customer confirms the service was delivered or reports it was not. The stages are configured in 'Configurable order status model'.

**Who uses it:** Shoppers; service providers; finance staff; client operations staff; Malawi Post customers

**What it does**

- Service providers move each service order through requested, confirmed, scheduled, in progress and completed; each change records who and when and is shown to the shopper.
- Providers mark a service completed with a completion note and optional evidence files, and the shopper is asked to confirm.
- Shoppers confirm the service was delivered, which makes the provider eligible for payment.
- Shoppers report that a service was not delivered, with a reason; payment to the provider is held and operations staff are asked to review.
- Operations staff decide that the service failed, which starts a refund under the client's refund policy.
- Proposed, to be confirmed: operations staff can instead send the service back for rework at a new time slot.
- Malawi Post customers see, for each service in an order, its current stage, the next step and the date of each change.

**Rules**

- Only the stage changes allowed by the configured order status model can be made.
- A provider is paid for a service only after it is accepted; services reported not delivered or failed are not paid out.
- Proposed, to be confirmed: a service is accepted automatically if the customer does not answer within the sign-off period; the period is not stated in the source.
- Service failures follow the "not delivered" path, not a product return.

**Benefit:** There is a clear record that a service was actually delivered before money changes hands.

### PRD-SVC-006 Service location at booking

| Key facts |  |
|---|---|
| Phase | Phase 2 |
| Pack | Services and bookings pack (optional) |
| For | Business buyers and shoppers |
| Availability | Depends on a pending decision: acceptance by the Product Owner of features recommended without a client source (ref PO-REC-v8) |

When booking, the customer says where the service happens (at their site, at an outlet, or remotely) and the platform checks that a provider covers that place.

**Who uses it:** Shoppers; service providers

**What it does**

- Proposed, to be confirmed: shoppers choose one of the location types the service allows: at their site (with an address), at an allowed outlet, or remotely (with a contact channel).
- Shoppers place a pin on a map for their site, so the provider can find places without a street address; the provider sees the pin with the address.
- The location is recorded with the booking.
- Bookings for places outside every available provider's coverage, or outside the client's delivery areas, are stopped and the shopper is told.
- Only time slots of resources that cover the chosen place are offered.

**Benefit:** Avoids bookings that cannot be delivered where the customer needs them.

### PRD-SVC-007 Digital products and downloads

| Key facts |  |
|---|---|
| Phase | Phase 2 |
| Pack | Always included |
| For | Business buyers and shoppers |
| Availability | Depends on a pending decision: acceptance by the Product Owner of features recommended without a client source (ref PO-REC-v8) |

Sell items delivered electronically, such as e-documents, licences, reports or e-vouchers, which the customer downloads or receives by email after payment, with download limits and expiry.

**Who uses it:** Shoppers; business buyers; client administrators; finance staff

**What it does**

- Make a download available once the order is paid, or after an administrator activates it for a single order line.
- Show the download link in the order details and in order emails.
- Limit the number of downloads and the number of days a download stays available.
- Require the shopper to accept a user agreement before downloading.
- Provide a separate licence file for each order line where a licence is sold.
- List each allowed download in My account, so the shopper can download again within the limits.

**Rules**

- Downloads are refused once the maximum number is reached or the availability period has passed.
- Where the client switches it on, a download link works only for the customer who bought the item.
- Vouchers for a paid service are covered in 'Service vouchers and e-tickets'; store-credit gift cards in 'Gift cards and vouchers'.

**Benefit:** Items such as e-documents or licences can be sold and delivered without shipping.

### PRD-SVC-008 Rental and hire

| Key facts |  |
|---|---|
| Phase | Phase 2 |
| Pack | Services and bookings pack (optional) |
| For | Business buyers and shoppers |
| Availability | Planned for phase 2 |

Hire out items for a period, for example equipment or vehicles: the customer picks start and end dates, the price depends on the length of hire, and availability is checked for those dates.

**Who uses it:** Shoppers; business buyers; service providers

**What it does**

- Shoppers choose start and end dates and see the price for that length of hire, priced per day or week; the dates are kept on the order.
- Dates are refused if the end is before the start or the start is in the past.
- Proposed, to be confirmed: providers set how many units of an item they can hire out, or link equipment they have recorded as resources.
- Items are refused for any period in which all units are already taken.
- Proposed, to be confirmed: a unit is held for the shopper at the final checkout step until the order is placed or the hold expires.

**Rules**

- Proposed, to be confirmed: availability for each day is the number of units minus units already ordered or held for other customers; a request with any day fully taken is refused.
- The hold time is a setting; the default is not stated in the source.

**Benefit:** Equipment and vehicles can earn money through hire, priced by length of use.

### PRD-SVC-009 Service vouchers and e-tickets

| Key facts |  |
|---|---|
| Phase | Phase 2 |
| Pack | Services and bookings pack (optional) |
| For | Business buyers and shoppers |
| Availability | Depends on a pending decision: acceptance by the Product Owner of features recommended without a client source (ref PO-REC-v8) |

After paying, the customer receives a voucher or e-ticket with a code or QR code that the provider scans to redeem the service. These are proof of a paid service, not store credit or a parcel pickup code.

**Who uses it:** Shoppers; service providers; outlet staff; Malawi Post customers

**What it does**

- Issue one voucher or e-ticket per unit after payment, with a unique code and QR code, and send it to the customer.
- Show each voucher in My account with its code, QR code, service, validity and status.
- Providers and outlet staff scan or type the code to check it, and redeem it; each use is recorded with time, user and place.
- Refuse vouchers that are used up, expired, cancelled or for another provider's service, saying only that the voucher is not valid.
- Expire unused vouchers at the end of their validity.
- Issue e-tickets for ticketing partner services listed by Malawi Post.
- Proposed, to be confirmed: cancel an unused voucher when its order line is refunded.

**Rules**

- Proposed, to be confirmed: voucher codes are unique, hard to guess and include a check character.
- A voucher can be redeemed only by the provider of its service (or outlet staff for operator services), within its validity, while uses remain.
- Proposed, to be confirmed: if the same voucher is scanned at two places at once, only one redemption succeeds.

**Benefit:** Simple, fraud-resistant proof that a service has been paid for.

### PRD-SVC-010 Service reminders and follow-up

| Key facts |  |
|---|---|
| Phase | Phase 2 |
| Pack | Services and bookings pack (optional) |
| For | Business buyers and shoppers |
| Availability | Depends on a pending decision: acceptance by the Product Owner of features recommended without a client source (ref PO-REC-v8) |

Automatic reminders before a booked service and a follow-up afterwards asking for feedback or a rating.

**Who uses it:** Shoppers; service providers

**What it does**

- Send reminders before a confirmed booking at the times set for the service, on the channels the customer allows.
- Stop reminders for a cancelled time slot and follow the new slot after a reschedule.
- After the customer confirms a service, send one feedback request with a link to the review form.

**Rules**

- One reminder per set time and one feedback request per service line.
- Customers who opted out of feedback messages receive none.
- Reminder times are set per service; values are not stated in the source.

**Benefit:** Fewer missed appointments and better service quality.

### PRD-SVC-011 Service-level targets for service orders

| Key facts |  |
|---|---|
| Phase | Phase 1 |
| Pack | Services and bookings pack (optional) |
| For | Staff (back office) |
| Availability | Planned for phase 1 |

Applies the service-level targets set in 'Cut-offs and service levels' to service orders: for each service the client sets response and completion times, and the platform tracks each order against them and escalates when they are missed.

**Who uses it:** Client operations staff; shoppers

**What it does**

- Operations staff set response and completion targets per service, and per service level (for example express or standard), with the point each clock starts from (order placed or scheduled start).
- Apply the targets of the service level the shopper chooses.
- Track each service order against its response and completion due times.
- Warn the first escalation level when a target is at risk.
- When a target is missed, notify each escalation level in turn at its set interval and record the miss for reports.
- Show the shopper the promised response and completion times on the service and the order.

**Rules**

- A target is met when the stage is reached before the due time; otherwise it is missed.
- Target changes are recorded and kept in versions with an effective date; an order keeps the targets in force when it was placed.

**Benefit:** Services are delivered on time, and late ones are acted on.

### PRD-SVC-012 Service reports

| Key facts |  |
|---|---|
| Phase | Phase 2 |
| Pack | Services and bookings pack (optional) |
| For | Staff (back office) |
| Availability | Depends on a pending decision: whether postal operations, e-Government services and Malawi Post financial services are part of the product (Malawi Post to decide) (ref FG-06); acceptance by the Product Owner of features recommended without a client source (ref PO-REC-v8) |

Reports on bookings, how busy providers are, completed and cancelled services, no-shows and service-level performance.

**Who uses it:** Management; operations staff; service providers

**What it does**

- Bookings report: counts by service, provider and outcome (confirmed, attended, cancelled by customer or provider, customer or provider no-show), with export.
- Utilisation report: for each resource and period, booked capacity as a share of available capacity.
- Completion report: services accepted, not delivered, failed and cancelled, by service and provider.
- Service-level report: targets met and missed, the share met, and average time to response and completion, per service and target.

**Rules**

- Service providers see only their own services and resources in reports.

**Benefit:** Shows demand for services and where delivery needs to improve.

<!-- pagebreak -->

# 8. Quality and service requirements

All 70 quality and service requirements, grouped by theme. The reference in square brackets is the number of the requirement in the client documents (KTDA or Malawi Post) or in the product baseline (NFR-X). Every measurable value is as stated in the source; where no value is stated, this is said.


## 8.1 Availability and continuity (5)

- A disaster-recovery approach that ensures high availability. [REQ-MPC-NFR-001]
- Online backup that does not interrupt core operations. [REQ-MPC-NFR-002]
- If a payment is interrupted, the shopper can resume checkout, with safeguards against the order being processed twice. [REQ-MPC-FR-114]
- Backup and restore reporting (backup success, last restore test) for audit. [REQ-MPC-FR-297]
- Proposed: a repeated request never causes a duplicate action, and two people editing the same record at the same time do not overwrite each other's work. [NFR-X-007]


## 8.2 Performance and capacity (4)

No response-time, load or availability target is stated in the source documents [NFR-X-009].

- The platform is scalable and new features can be added. [REQ-KTDA-NFR-001]
- Cloud hosting for the first 6 months, with at least 2 TB of storage, 4 cores at 2.0 GHz and 8 GB of RAM. Whether this size is a minimum or a maximum is pending (decision C-SIZE). [REQ-MPC-HST-002]
- Monitoring of system health and usage (page views, requests from connected systems), with alerts on anything unusual. [REQ-MPC-FR-290]
- Performance dashboards showing response times of key transactions: search, checkout and payment confirmation. [REQ-MPC-FR-299]


## 8.3 Security (14)

- Card payments are handled in line with PCI-DSS, the card industry's data security standard. [REQ-KTDA-SEC-001]
- Best-practice cybersecurity, including a firewall, SSL (encrypted connections) and protection against denial-of-service (DDoS) attacks. [REQ-KTDA-SEC-002]
- Protection against hacking and tampering, against unauthorised access, and for data in transit. [REQ-MPC-SEC-001]
- Multi-factor sign-in (MFA) for privileged administrative roles. [REQ-MPC-FR-012]
- A configurable session time-out, and automatic sign-out of idle users. [REQ-MPC-FR-013]
- Every sign-in attempt is recorded and available for security monitoring and audit. [REQ-MPC-FR-015]
- Configurable account security policies (password rules, lock-out thresholds, multi-factor sign-in), aligned to the Malawi Post security programme. [REQ-MPC-FR-021]
- A secure checkout session: prices and totals cannot be tampered with between the user's device and the platform. [REQ-MPC-FR-121]
- Secure sign-in and authorisation for connected systems (for example OpenID Connect, or equivalent), as supported by the chosen integration gateway. [REQ-MPC-FR-338]
- Limits on request rates, throttling and abuse detection for outside systems that connect to the platform. [REQ-MPC-FR-339]
- A payment that is retried is never charged twice. [REQ-MPC-FR-135]
- Staff can set the maximum upload size, the accepted file types and content scanning. [REQ-MPC-FR-324]
- Payment data is encrypted when stored and when sent; full card details are never stored in readable form. [REQ-MPC-FR-148]
- No high or critical security weakness in the software components of any delivered release (proposed); card data is never stored; access is limited by role. [NFR-X-001]


## 8.4 Privacy and data protection (8)

- The platform supports compliance with local and international e-commerce, trade and data-protection regulations. [REQ-KTDA-LEG-001]
- Data for analytics and customer insight is collected lawfully. [REQ-KTDA-ANL-008]
- Role-based permissions for support agents restrict access to sensitive personal data. [REQ-MPC-FR-263]
- Consent management for cookies and tracking, and for marketing messages, where applicable. [REQ-MPC-FR-010]
- Users can ask for access to their personal data and receive a copy (a data subject access request). [REQ-MPC-FR-017]
- Users can ask for correction of the personal information used for their orders and deliveries. [REQ-MPC-FR-018]
- Data can be anonymised or pseudonymised for analytics when policy requires it. [REQ-MPC-FR-293]
- Personal data is handled under each country's data-protection profile, with consent, copy, deletion, retention and breach handling. The laws expected to apply are the Kenya Data Protection Act 2019 and the Malawi Data Protection Act 2024 (expected; to be confirmed, decision DP-01). [NFR-X-002]


## 8.5 Accessibility and usability (13)

- The platform works on mobile phones, tablets and desktop computers. [REQ-KTDA-UX-001]
- Checkout is easy to use. The source gives no measurable target. [REQ-KTDA-CHK-003]
- A clean, modern and user-friendly look, aligned with KTDA branding. [REQ-KTDA-UX-002]
- Users reach the platform through a web browser. [REQ-MPC-ARC-002]
- A user-friendly platform and ordering system. [REQ-MPC-UX-001]
- Easy to use on PCs and on mobile devices. [REQ-MPC-UX-002]
- Runs smoothly in mobile web browsers. [REQ-MPC-UX-003]
- Several ways to navigate, suited to users with different levels of experience. [REQ-MPC-UX-004]
- Light pages suitable for low-bandwidth connections and low-end devices. [REQ-MPC-FR-019]
- Search and navigation that work with a keyboard and with screen readers, on the web channels. [REQ-MPC-FR-092]
- Clear error messages and retry prompts for search when the connection comes and goes. [REQ-MPC-FR-096]
- Proposed accessibility standard: WCAG 2.1 level AA. The clients state keyboard navigation and screen-reader support. [NFR-X-005]
- Works on phones, tablets and desktops, and behaves well on low bandwidth. No page-weight or load-time target is stated; to be confirmed. [NFR-X-006]


## 8.6 Languages and localisation (1)

KTDA names Kiswahili, English, French, Arabic, Russian and Mandarin, with several currencies and a US dollar base. Malawi Post names English and Chichewa as examples. Language and currency features are in module 1 (Platform).

- All on-screen text is held in language packs so that it can be translated. Right-to-left layout for Arabic is expected (to be confirmed). [NFR-X-004]


## 8.7 Interoperability (3)

- Open, non-proprietary data storage. [REQ-MPC-ARC-003]
- Health monitoring of connections to other systems, with alerts on failures and on responses slower than the set thresholds. [REQ-MPC-FR-342]
- Change logs for connections to other systems, and a policy that keeps new versions backward compatible. [REQ-MPC-FR-347]


## 8.8 Audit and records (10)

- A transaction audit trail that can be exported in different formats. [REQ-MPC-AUD-001]
- Audit records that cannot be altered, covering every order status change and every change to key order details. [REQ-MPC-FR-175]
- Audit records of every support ticket change (status, assignment, edits), showing who made the change and when. [REQ-MPC-FR-274]
- Audit reports of sign-ins, administrator actions and configuration changes, for security and compliance monitoring. [REQ-MPC-FR-287]
- User management and access audit reports: role assignments, privileged accounts and multi-factor sign-in status. [REQ-MPC-FR-298]
- Audit records of every administrative configuration change, with who, when, and the old and new values. [REQ-MPC-FR-318]
- Retention and archiving rules for tracking history, consistent with compliance and operational needs. [REQ-MPC-FR-225]
- Configurable retention of dispute and return case records and evidence, in line with the data-retention policy. [REQ-MPC-FR-248]
- Configurable data-retention and archiving rules for the key areas: orders, payments, tickets and logs. [REQ-MPC-FR-322]
- Important actions are recorded in the platform audit trail with their before and after values. [NFR-X-003]


## 8.9 Support and maintainability (7)

- At least 12 months of support after implementation (a project service). [REQ-KTDA-SUP-001]
- An extensible design that allows future expansion. [REQ-MPC-ARC-005]
- 18 months of support after implementation (a project service). [REQ-MPC-SUP-001]
- Support response targets: critical 1 hour, high 4 hours, medium 8 hours. [REQ-MPC-SUP-002]
- A second-level help desk with machine-learning abilities for bugs and errors. [REQ-MPC-SUP-003]
- Proposed: no client-specific changes to the core product; new client settings are added to the configuration packs. [NFR-X-008]
- Support response targets stated by Malawi Post: critical 1 hour, high 4 hours, medium 8 hours (whether these are response or resolution times is not stated). Performance, availability, recovery-time and recovery-point targets are not stated in the source documents; to be confirmed. [NFR-X-009]


## 8.10 Hosting and environment (5)

- A user acceptance testing (UAT) environment is available before production. [REQ-KTDA-ENV-001]
- Secure, scalable hosting; cloud hosting is preferred (AWS, Azure). [REQ-KTDA-HST-001]
- A three-tier set-up — data servers, application servers and user devices — with a data warehouse for data storage. [REQ-MPC-ARC-001]
- Compatible with Windows Server 2019, or the newest version at the time of implementation. [REQ-MPC-ARC-004]
- The hosting environment is assessed and a hosting assessment report is delivered (a project service). [REQ-MPC-HST-001]

# 9. Connections to other systems

The product connects to the systems below. Certainty is as stated in the source: a system is "named" when a client document names it; "expected" when it is inferred.

| System | Client | What it is for | Certainty | Features |
|---|---|---|---|---|
| PayPal | KTDA | Online payments by PayPal | Named by KTDA; whether it is acceptable under the bank-gateway rule is pending (decision K-08) | PRD-PAY-003 |
| Bank card payment gateway | KTDA | Card payments through a gateway operated by a Central Bank of Kenya-regulated bank | Bank not named yet | PRD-PAY-002, PRD-PAY-031 |
| Card payment provider | Malawi Post | Card payments | Provider not named yet | PRD-PAY-002, PRD-PAY-032 |
| M-Pesa (Safaricom) | KTDA | Mobile money payments | Named by KTDA; settlement currency is pending (decision C-FX) | PRD-PAY-004, PRD-PAY-028 |
| TNM Mpamba and Airtel Money | Malawi Post | Mobile money payments | Named by Malawi Post | PRD-PAY-004, PRD-PAY-029, PRD-PAY-030 |
| Bank systems | KTDA and Malawi Post | Bank transfers, payment notices and reconciliation | Banks not named yet | PRD-INT-008, PRD-PAY-005, PRD-PAY-014 |
| Escrow provider (bank or payment service provider) | KTDA | Holding buyer funds until delivery is confirmed | Provider not named; payment model pending (decision PAY-DIRECT) | PRD-PAY-007 |
| KRA eTIMS and MRA EIS | Kenya and Malawi | Statutory electronic invoicing to the tax authorities | Expected under tax law; not stated in the client documents (decision E-INV) | PRD-PAY-025, PRD-PAY-026, PRD-PAY-027 |
| KTDA ERP system(s) | KTDA | Exchanging orders, stock and finance data with KTDA's own systems | System not named yet | PRD-INT-005 |
| Couriers and shipping lines (DHL, FedEx, G4S, Skynet, Wells Fargo, Aramex, shipping lines) | KTDA | Booking deliveries and tracking parcels | Named by KTDA; real-time tracking depends on what each courier offers | PRD-LOG-021, PRD-LOG-006, PRD-LOG-025 to PRD-LOG-030 |
| PostGlobal | Malawi Post | Postal operations | Named by Malawi Post; which postal operations stay in PostGlobal is pending (decision FG-06) | PRD-INT-007 |
| SAGE 200 | Malawi Post | Accounting: posting sales and payments, reconciliation | Named by Malawi Post | PRD-INT-006 |
| MANEPS | Malawi Post | Government e-procurement | Named by Malawi Post; purpose and data not stated yet | PRD-INT-013 |
| Malawi Post core systems | Malawi Post | Customer accounts | Named by Malawi Post; details not stated | PRD-IAM-019 |
| UPU CDS, IPS and GMS | Malawi Post | International postal exchange: customs data, item tracking and monitoring | Named by Malawi Post | PRD-LOG-016 |
| Delivery partners | Malawi Post | Last-mile delivery by partners | Partners not named | PRD-LOG-031 |
| USSD operator or aggregator | Malawi Post | Menu service on basic phones | Use cases and operator not stated | PRD-CHN-003 |
| SMS gateway | Malawi Post (KTDA expected, for one-time codes) | Text messages | Provider not named. The platform comes with a ready-made Twilio connection; Twilio is not assumed until its coverage in Kenya and Malawi and its handling of personal data are confirmed | PRD-CHN-005, PRD-CHN-012 |
| WhatsApp Business and WeChat | KTDA and Malawi Post | Chat with customers | Named by the clients | PRD-CHN-006, PRD-CHN-007, PRD-AI-003 |
| Live chat service | KTDA | Live chat on the website | Service to be selected | PRD-CRM-008 |
| AI language service for the chatbot | Malawi Post | Answering customer questions | Machine-learning expectations not stated | PRD-AI-003, PRD-AI-010 |
| Google Ads, analytics and social media platforms | KTDA and Malawi Post | Marketing, measurement and social selling | Named by the clients; campaigns are a project service | PRD-MKT-010, PRD-SRC-021, PRD-CHN-011 |
| Analytics platforms and data warehouse | KTDA and Malawi Post | Advanced analytics and reporting | Named by the clients; products not stated | PRD-RPT-003, PRD-RPT-008 |
| Cloud hosting (AWS or Azure) | KTDA | Hosting | Preferred by KTDA; hosting is a project service; hosting region pending (decision DP-01) | PRD-PLT-002 |
| National ID or registry checks and mobile-network identity checks | Malawi Post | Verifying the identity of sellers and customers | Registries not named | PRD-IAM-020, PRD-SEL-004 |
| Regulators and dispute-resolution bodies (for example MACRA) | Malawi Post | Regulatory reporting and dispute escalation | Data and format not stated | PRD-INT-009 |
| Government agencies | Malawi Post | Passing on fees collected for government services | Pending (decision FG-06) | PRD-EGV-005 |
| Electronic signature provider | — | Signing contracts and documents | Provider not named | PRD-ORD-017 |

# 10. What each client can configure without development

Settings are layered. A product default applies to every client; a country pack adds country rules; an industry pack adds sector settings; the client pack adds the client's own choices; and a shop can have its own values. A more specific layer replaces only the values it states (proposed, decision CFG-01). Passwords and keys for connected services are never stored in packs; they are entered for each installation.

| What can be set | Where it is set (from general to specific) | Feature |
|---|---|---|
| Core shop settings: catalogue, orders, customers, cart, shipping, tax, pictures, search-engine visibility and security | product default → industry pack → client → shop | PRD-PLT-003 |
| Shops run by the client, and which products and content appear in each shop | client → shop | PRD-PLT-013 |
| Look and feel, logo and branding | client → shop | PRD-PLT-006 |
| Languages and the translated on-screen text | product default → industry pack → client | PRD-PLT-009, PRD-PLT-025 |
| Currencies and the exchange-rate source | client → shop | PRD-PLT-010, PRD-PLT-024 |
| Time zone, date and number formats, and the financial year | client | PRD-PLT-011, PRD-PLT-012 |
| Email message wording | product default → industry pack → client → shop | PRD-TRK-004 |
| Message wording and which channel (email, SMS, WhatsApp and others) is used for each notice | product default → industry pack → client | PRD-TRK-005 |
| Roles and what each role may see and do | product default → industry pack → client | PRD-IAM-007, PRD-IAM-008 |
| Which features are switched on | industry pack → client → shop | PRD-PLT-022 |
| Which optional components and connections are switched on | industry pack → client → shop | PRD-PLT-022 |
| Product categories and product characteristics | industry pack → client | PRD-CAT-001, PRD-CAT-004 |
| Information required for products in each category, and listing rules | industry pack → client | PRD-CAT-005 |
| Tax categories and rates | product default → country → client | PRD-PAY-020 |
| Which statutory e-invoicing connection is used | country → client | PRD-PAY-025 |
| Payment methods offered and where each is offered | country → client → shop | PRD-PAY-001, PRD-PAY-024 |
| Delivery options, delivery charges and delivery dates | client → shop | PRD-LOG-001, PRD-LOG-002 |
| Which courier connections are used | country → client | PRD-LOG-021 |
| Pick-up points and outlets | client | PRD-LOG-003 |
| Order statuses and the reasons staff must give for changes | industry pack → client | PRD-ORD-002, PRD-ORD-003 |
| Return reasons and the actions offered | industry pack → client | PRD-RET-001 |
| Approval and processing workflows | industry pack → client | PRD-ADM-002 |
| Business rules (for example eligibility and limits) | industry pack → client | PRD-ADM-003 |
| Transaction types and their templates | industry pack → client | PRD-ADM-004, PRD-ADM-011 |
| Content pages, policies and help topics | industry pack → client → shop | PRD-MKT-007, PRD-MKT-008 |
| Country legal profile: electronic-transaction and data-protection rules, consent texts and deadlines | country | PRD-CHK-009, PRD-SEC-012 |
| Automatic tasks and how often they run (for the whole installation) | whole installation | PRD-ADM-001 |
| Default discounts and promotions | industry pack → client | PRD-MKT-001 |
| Marketplace: seller rules, commission and seller tiers | industry pack → client | PRD-SEL-003, PRD-SEL-016 |
| Business trade: company account roles, credit terms, price-list priority and approval limits | industry pack → client | PRD-IAM-022, PRD-CHK-016, PRD-CAT-039 |
| Postal: tracking-number series, hubs, routes and holding charges | industry pack → client | PRD-LOG-020, PRD-LOG-023, PRD-LOG-017 |
| e-Government: agencies, service catalogue and fees | industry pack → client | PRD-EGV-001, PRD-EGV-005 |
| Countries, regions and districts (for example Kenya counties and Malawi districts) | product default → country → client | PRD-CHK-007, PRD-LOG-002, PRD-PAY-020 |
| How long each kind of data is kept | country → client | PRD-PLT-020 |
| SMS provider, sender name, opt-out keywords and quiet hours | country → client | PRD-CHN-005, PRD-CHN-012 |
| Extra customer details and extra checkout questions | industry pack → client → shop | PRD-MKT-011, PRD-CHK-015 |
| Weights, sizes and units of sale | product default → industry pack → client | PRD-CAT-002, PRD-CAT-041 |
| Payment fees | country → client | PRD-PAY-015 |
| Where each outlet or seller can deliver or serve | client | PRD-LOG-004 |
| Key performance indicators and how they are calculated | industry pack → client | PRD-RPT-002 |
| Other core settings: spam protection on forms, privacy and cookies, multi-factor sign-in, reward points, languages and shop information | product default → client → shop | PRD-SEC-013, PRD-SEC-007, PRD-IAM-004, PRD-MKT-003, PRD-PLT-009, PRD-PLT-006 |
| Warehouse: warehouses, batches and lots, serial numbers, expiry, stock counts and stock synchronisation | industry pack → client | PRD-INV-002, PRD-INV-009, PRD-INV-011, PRD-INV-012 |
| Channels: mobile app branding, USSD and voice menus, WhatsApp, WeChat and Telegram accounts, and push messages | industry pack → client | PRD-CHN-001, PRD-CHN-003, PRD-CHN-004, PRD-CHN-006, PRD-CHN-013 |
| Artificial intelligence: provider, which features use it, translation languages and disclosures to users | industry pack → client | AI-001 – AI-010 |
| Analytics: data sources, dashboards and published figures | industry pack → client | PRD-RPT-010, PRD-RPT-011, PRD-RPT-007, PRD-RPT-008 |
| Schemes: scheme rules, eligibility, budgets and partner finance and insurance products | industry pack → client | PRD-ORD-024, PRD-PAY-022, FIN-001 – FIN-004 |
| Assisted service: agent roles, outlet assignment, receipt printers and cash-up rules | industry pack → client | PRD-IAM-026, PRD-CHK-013, PRD-PAY-034 |
| Services: service templates, coverage areas and booking slots | industry pack → client | PRD-CAT-026, PRD-CAT-027 |
| Engagement: reward-point rules, promotion types, pop-ups, reminder timing, affiliates and subscription cycles | industry pack → client → shop | PRD-MKT-002, PRD-MKT-003, PRD-MKT-012, PRD-ORD-028 |
| Service desk: complaint categories, escalation to dispute resolution and the support channel directory | industry pack → client | PRD-CRM-004, PRD-CRM-012 |
| Commerce extensions: purchase restrictions, return fees, product feeds and PayPal options | industry pack → client → shop | PRD-CHK-011, PRD-RET-006, PRD-CAT-035, PRD-PAY-003 |
| Access: delegation rules, passwordless and biometric sign-in, and guided tours | industry pack → client | PRD-IAM-009, PRD-IAM-013, PRD-PLT-019 |
| Connections to other systems and what each connected system may access | country → client | PRD-INT-001, PRD-INT-004, PRD-INT-005 |

# 11. Release plan

| Phase | What it brings | Features |
|---|---|---|
| Phase 1 | What KTDA and Malawi Post need, the go-live essentials (for example domains and certificates, email sending, accessibility, vulnerability management and data residency), and the machinery for onboarding new clients by configuration. | 337 |
| Phase 2 | The remaining capabilities a general business and retail e-commerce system for goods and services needs. | 76 |
| Phase 3 | Specialised capabilities: the artificial intelligence pack, the agri-finance and schemes pack, and other best-in-class features. | 21 |
| Total |  | 434 |

The order of work inside a phase is set by the Product Owner. Delivery dates are not stated in this document.

## 11.1 Features per module and phase

| Module | Phase 1 | Phase 2 | Phase 3 | Total |
|---|---|---|---|---|
| Platform foundation and multi-client set-up | 25 | 2 | 0 | 27 |
| Accounts, sign-in and access | 22 | 5 | 0 | 27 |
| Sellers and marketplace | 20 | 4 | 1 | 25 |
| Product catalogue | 34 | 9 | 0 | 43 |
| Inventory and warehouses | 8 | 5 | 0 | 13 |
| Search, discovery and merchandising | 21 | 6 | 0 | 27 |
| Cart and checkout | 19 | 0 | 0 | 19 |
| Payments, tax, settlement and reconciliation | 33 | 2 | 1 | 36 |
| Orders, quotations and contracts | 19 | 7 | 2 | 28 |
| Shipping, delivery and fulfilment | 31 | 0 | 1 | 32 |
| Tracking and customer messages | 11 | 1 | 0 | 12 |
| Returns, refunds and disputes | 11 | 0 | 0 | 11 |
| Customer service, help desk and chat | 12 | 2 | 1 | 15 |
| Marketing, promotions, loyalty, content and SEO | 12 | 2 | 0 | 14 |
| Reporting and analytics | 9 | 2 | 1 | 12 |
| Administration, workflow and operations console | 6 | 5 | 1 | 12 |
| Documents and records | 3 | 3 | 0 | 6 |
| Security, audit and compliance | 10 | 5 | 0 | 15 |
| Connections with other systems | 12 | 0 | 1 | 13 |
| Channels: mobile app, installable website, USSD, SMS, WhatsApp and assisted service | 7 | 5 | 1 | 13 |
| AI capabilities | 2 | 1 | 7 | 10 |
| Financial products | 1 | 0 | 4 | 5 |
| e-Government and service catalogue (optional pack) | 7 | 0 | 0 | 7 |
| Services commerce (booking, delivery and completion of services) | 2 | 10 | 0 | 12 |

# 12. Assumptions, constraints and dependencies

## 12.1 Assumptions

- Each client has its own installation of the product (the default). Whether clients may instead share one installation is pending (decision F-CAT-B).
- Project services — training, support, hosting provision, hardware and marketing campaigns — are delivered by the project, not by the product.
- Where a client document does not name a system, provider or value (for example the KTDA bank and ERP, or the Malawi Post card provider), the product provides the connection and the value is configured once the client names it.

## 12.2 Constraints

- The product is built on an established open-source e-commerce platform, version 5.00.1, which runs on Microsoft .NET 10 (decided on 24 November 2026, decision VER-500). It replaces the earlier choice of version 4.90.
- Malawi Post states a server size of 4 cores at 2.0 GHz, 8 GB of RAM and at least 2 TB of storage for the first 6 months of cloud hosting [REQ-MPC-HST-002]; whether this is a minimum or a maximum is pending (decision C-SIZE).
- Malawi Post requires compatibility with Windows Server 2019 or newer [REQ-MPC-ARC-004], browser-based access and open, non-proprietary data storage.
- Proposed: in phase 1, checkout runs on one web server until protection against duplicate orders across several web servers is delivered in phase 2 (decision SINGLE-NODE).
- Proposed: in phase 1, a shopping cart that contains items from several sellers is limited to one seller per order until combined payment is available (decision SPLIT-PAY).
- One shopping cart can hold items from several sellers, and checkout splits the order and the payment between them. The platform's own option of a separate cart for each seller stays switched off, because it would stop a mixed cart from reaching checkout (decision CART-500).
- Special prices for a customer or a company use the platform's own price lists. Prices fixed separately for each currency are built for the product. Where a product has both a quantity price and a customer price list, the platform uses the quantity price, so a rule is set for products that have both (decision PRICE-500).
- Bidding and auctions are left out of the product (decision D-02).

## 12.3 Dependencies

- 100 of the 434 features depend on a pending decision; their facts box says which. The decisions, their owners and the open questions are listed in the Decisions, gaps and open items register.
- Some features need content that Malawi Post has not yet provided: the private-sector service list (Table 8), return shipping models (Table 10), priority e-Government services (Table 13) and the complaints and dispute-resolution policy (decision T-MISS).
- Some connections need the client to name the other party: the KTDA bank and ERP, the Malawi Post card payment provider, and the purpose and data of the MANEPS connection.
- Measurable targets for performance, availability, recovery and overall success are not stated in the source documents and are to be confirmed [NFR-X-009].
- Statutory electronic invoicing (KRA eTIMS, MRA EIS) is expected under tax law but is not stated in the client documents; it is pending confirmation by both clients (decision E-INV).
- Some ready-made add-ons come from other suppliers (NopStation, Nop-Templates, FoxNetSoft and AFR). Whether each supplier offers a version for platform version 5.00 cannot be confirmed from the platform itself and is to be confirmed with each supplier (decision V-01).
- Three outside services that come with platform version 5.00 — Google AI product search, the Jotform chat assistant and Twilio text messages — are switched on only after their handling of personal data is confirmed under the Kenya and Malawi data-protection laws (decision DP-01).
- Whether Twilio delivers text messages reliably to Kenyan and Malawian mobile networks is not stated in any source and is to be confirmed; a local text-message provider can be connected instead.
- Whether platform version 5.00 runs on Windows Server 2019, as Malawi Post requires [REQ-MPC-ARC-004], is to be confirmed against Microsoft's support list for .NET 10.

<!-- pagebreak -->

# Appendix A. Feature index

All 434 features. In the PDF, every entry links to the feature.

| ID | Feature | Module | Phase | Page |
|---|---|---|---|---|
| PRD-PLT-001 | Client site set-up | Platform foundation and multi-client set-up | Phase 1 | {{PG:PRD-PLT-001}} |
| PRD-PLT-002 | Client data separation | Platform foundation and multi-client set-up | Phase 1 | {{PG:PRD-PLT-002}} |
| PRD-PLT-003 | Configuration packs | Platform foundation and multi-client set-up | Phase 1 | {{PG:PRD-PLT-003}} |
| PRD-PLT-004 | Settings change control | Platform foundation and multi-client set-up | Phase 1 | {{PG:PRD-PLT-004}} |
| PRD-PLT-005 | Settings export, import and promotion | Platform foundation and multi-client set-up | Phase 1 | {{PG:PRD-PLT-005}} |
| PRD-PLT-006 | Branding and look | Platform foundation and multi-client set-up | Phase 1 | {{PG:PRD-PLT-006}} |
| PRD-PLT-007 | Own web address and security certificate | Platform foundation and multi-client set-up | Phase 1 | {{PG:PRD-PLT-007}} |
| PRD-PLT-008 | Email sender identity | Platform foundation and multi-client set-up | Phase 1 | {{PG:PRD-PLT-008}} |
| PRD-PLT-009 | Languages and address places | Platform foundation and multi-client set-up | Phase 1 | {{PG:PRD-PLT-009}} |
| PRD-PLT-010 | Currencies and exchange rates | Platform foundation and multi-client set-up | Phase 1 | {{PG:PRD-PLT-010}} |
| PRD-PLT-011 | Time zone and formats | Platform foundation and multi-client set-up | Phase 1 | {{PG:PRD-PLT-011}} |
| PRD-PLT-012 | Financial year for reporting | Platform foundation and multi-client set-up | Phase 2 | {{PG:PRD-PLT-012}} |
| PRD-PLT-013 | Several shops for one client (trade and retail) | Platform foundation and multi-client set-up | Phase 1 | {{PG:PRD-PLT-013}} |
| PRD-PLT-014 | Site health and service-level monitoring | Platform foundation and multi-client set-up | Phase 1 | {{PG:PRD-PLT-014}} |
| PRD-PLT-015 | Scalable, open design | Platform foundation and multi-client set-up | Phase 1 | {{PG:PRD-PLT-015}} |
| PRD-PLT-016 | Backup and disaster recovery | Platform foundation and multi-client set-up | Phase 1 | {{PG:PRD-PLT-016}} |
| PRD-PLT-017 | Mobile-friendly shop | Platform foundation and multi-client set-up | Phase 1 | {{PG:PRD-PLT-017}} |
| PRD-PLT-018 | Accessibility | Platform foundation and multi-client set-up | Phase 1 | {{PG:PRD-PLT-018}} |
| PRD-PLT-019 | On-screen help and guided tours | Platform foundation and multi-client set-up | Phase 1 | {{PG:PRD-PLT-019}} |
| PRD-PLT-020 | Record keeping and archiving | Platform foundation and multi-client set-up | Phase 1 | {{PG:PRD-PLT-020}} |
| PRD-PLT-021 | Product release and upgrades | Platform foundation and multi-client set-up | Phase 1 | {{PG:PRD-PLT-021}} |
| PRD-PLT-022 | Feature switchboard | Platform foundation and multi-client set-up | Phase 1 | {{PG:PRD-PLT-022}} |
| PRD-PLT-023 | Client data move toolkit | Platform foundation and multi-client set-up | Phase 1 | {{PG:PRD-PLT-023}} |
| PRD-PLT-024 | Exchange-rate sources | Platform foundation and multi-client set-up | Phase 1 | {{PG:PRD-PLT-024}} |
| PRD-PLT-025 | Translation management | Platform foundation and multi-client set-up | Phase 1 | {{PG:PRD-PLT-025}} |
| PRD-PLT-026 | Hosting size profile | Platform foundation and multi-client set-up | Phase 1 | {{PG:PRD-PLT-026}} |
| PRD-PLT-027 | Data consistency safeguards | Platform foundation and multi-client set-up | Phase 2 | {{PG:PRD-PLT-027}} |
| PRD-IAM-001 | Customer registration and sign-in | Accounts, sign-in and access | Phase 1 | {{PG:PRD-IAM-001}} |
| PRD-IAM-002 | Mobile-number accounts with one-time codes | Accounts, sign-in and access | Phase 1 | {{PG:PRD-IAM-002}} |
| PRD-IAM-003 | Password rules, temporary lock and recovery | Accounts, sign-in and access | Phase 1 | {{PG:PRD-IAM-003}} |
| PRD-IAM-004 | Second sign-in check by role | Accounts, sign-in and access | Phase 1 | {{PG:PRD-IAM-004}} |
| PRD-IAM-005 | Single sign-on for staff and business buyers | Accounts, sign-in and access | Phase 2 | {{PG:PRD-IAM-005}} |
| PRD-IAM-006 | Session control | Accounts, sign-in and access | Phase 1 | {{PG:PRD-IAM-006}} |
| PRD-IAM-007 | Roles and permissions | Accounts, sign-in and access | Phase 1 | {{PG:PRD-IAM-007}} |
| PRD-IAM-008 | Limited-scope permissions | Accounts, sign-in and access | Phase 1 | {{PG:PRD-IAM-008}} |
| PRD-IAM-009 | Handing over approval rights | Accounts, sign-in and access | Phase 2 | {{PG:PRD-IAM-009}} |
| PRD-IAM-010 | User administration | Accounts, sign-in and access | Phase 1 | {{PG:PRD-IAM-010}} |
| PRD-IAM-011 | Staff invitations and access reviews | Accounts, sign-in and access | Phase 1 | {{PG:PRD-IAM-011}} |
| PRD-IAM-012 | Sign-in records and suspicious sign-in alerts | Accounts, sign-in and access | Phase 1 | {{PG:PRD-IAM-012}} |
| PRD-IAM-013 | Passwordless and fingerprint or face sign-in | Accounts, sign-in and access | Phase 2 | {{PG:PRD-IAM-013}} |
| PRD-IAM-014 | Customer profile and address book | Accounts, sign-in and access | Phase 1 | {{PG:PRD-IAM-014}} |
| PRD-IAM-015 | Preferred pickup point and contact method | Accounts, sign-in and access | Phase 1 | {{PG:PRD-IAM-015}} |
| PRD-IAM-016 | Terms acceptance with versions | Accounts, sign-in and access | Phase 1 | {{PG:PRD-IAM-016}} |
| PRD-IAM-017 | Privacy rights | Accounts, sign-in and access | Phase 1 | {{PG:PRD-IAM-017}} |
| PRD-IAM-018 | Account activity history | Accounts, sign-in and access | Phase 1 | {{PG:PRD-IAM-018}} |
| PRD-IAM-019 | Account sync with Malawi Post systems | Accounts, sign-in and access | Phase 1 | {{PG:PRD-IAM-019}} |
| PRD-IAM-020 | Identity checks by country | Accounts, sign-in and access | Phase 1 | {{PG:PRD-IAM-020}} |
| PRD-IAM-021 | Customer order and document history | Accounts, sign-in and access | Phase 1 | {{PG:PRD-IAM-021}} |
| PRD-IAM-022 | Company accounts for business buyers | Accounts, sign-in and access | Phase 1 | {{PG:PRD-IAM-022}} |
| PRD-IAM-023 | Trade account applications and approval | Accounts, sign-in and access | Phase 1 | {{PG:PRD-IAM-023}} |
| PRD-IAM-024 | Tax-exempt and VAT-registered buyers | Accounts, sign-in and access | Phase 1 | {{PG:PRD-IAM-024}} |
| PRD-IAM-025 | Customer home page | Accounts, sign-in and access | Phase 2 | {{PG:PRD-IAM-025}} |
| PRD-IAM-026 | Assisted service by outlet agents | Accounts, sign-in and access | Phase 1 | {{PG:PRD-IAM-026}} |
| PRD-IAM-027 | Company cost centres and budgets | Accounts, sign-in and access | Phase 2 | {{PG:PRD-IAM-027}} |
| PRD-SEL-001 | Seller application and profile | Sellers and marketplace | Phase 1 | {{PG:PRD-SEL-001}} |
| PRD-SEL-002 | Seller documents | Sellers and marketplace | Phase 1 | {{PG:PRD-SEL-002}} |
| PRD-SEL-003 | Seller approval stages and levels | Sellers and marketplace | Phase 1 | {{PG:PRD-SEL-003}} |
| PRD-SEL-004 | Seller identity and registry checks | Sellers and marketplace | Phase 1 | {{PG:PRD-SEL-004}} |
| PRD-SEL-005 | Seller payout accounts | Sellers and marketplace | Phase 1 | {{PG:PRD-SEL-005}} |
| PRD-SEL-006 | Seller agreement acceptance | Sellers and marketplace | Phase 1 | {{PG:PRD-SEL-006}} |
| PRD-SEL-007 | Marketplace rules and listing checks | Sellers and marketplace | Phase 1 | {{PG:PRD-SEL-007}} |
| PRD-SEL-008 | Seller home page and onboarding checklist | Sellers and marketplace | Phase 1 | {{PG:PRD-SEL-008}} |
| PRD-SEL-009 | Seller staff accounts | Sellers and marketplace | Phase 1 | {{PG:PRD-SEL-009}} |
| PRD-SEL-010 | Seller types and sizes | Sellers and marketplace | Phase 2 | {{PG:PRD-SEL-010}} |
| PRD-SEL-011 | Seller performance monitoring | Sellers and marketplace | Phase 1 | {{PG:PRD-SEL-011}} |
| PRD-SEL-012 | Seller ratings | Sellers and marketplace | Phase 1 | {{PG:PRD-SEL-012}} |
| PRD-SEL-013 | Block and watch lists | Sellers and marketplace | Phase 1 | {{PG:PRD-SEL-013}} |
| PRD-SEL-014 | Approved supplier panels | Sellers and marketplace | Phase 2 | {{PG:PRD-SEL-014}} |
| PRD-SEL-015 | Bulk import and invitation of customers and sellers | Sellers and marketplace | Phase 2 | {{PG:PRD-SEL-015}} |
| PRD-SEL-016 | Commission and fee rules | Sellers and marketplace | Phase 1 | {{PG:PRD-SEL-016}} |
| PRD-SEL-017 | Seller settlements and payouts | Sellers and marketplace | Phase 1 | {{PG:PRD-SEL-017}} |
| PRD-SEL-018 | Seller locations and delivery by the client | Sellers and marketplace | Phase 1 | {{PG:PRD-SEL-018}} |
| PRD-SEL-019 | Seller holiday mode | Sellers and marketplace | Phase 1 | {{PG:PRD-SEL-019}} |
| PRD-SEL-020 | Seller notifications | Sellers and marketplace | Phase 1 | {{PG:PRD-SEL-020}} |
| PRD-SEL-021 | Seller onboarding progress report | Sellers and marketplace | Phase 1 | {{PG:PRD-SEL-021}} |
| PRD-SEL-022 | Seller diversity tracking | Sellers and marketplace | Phase 3 | {{PG:PRD-SEL-022}} |
| PRD-SEL-023 | Seller training content | Sellers and marketplace | Phase 1 | {{PG:PRD-SEL-023}} |
| PRD-SEL-024 | Seller blacklisting | Sellers and marketplace | Phase 1 | {{PG:PRD-SEL-024}} |
| PRD-SEL-025 | Commission invoices to sellers | Sellers and marketplace | Phase 2 | {{PG:PRD-SEL-025}} |
| PRD-CAT-001 | Category tree | Product catalogue | Phase 1 | {{PG:PRD-CAT-001}} |
| PRD-CAT-002 | Product record | Product catalogue | Phase 1 | {{PG:PRD-CAT-002}} |
| PRD-CAT-003 | Automatic product codes | Product catalogue | Phase 1 | {{PG:PRD-CAT-003}} |
| PRD-CAT-004 | Product options and descriptive details | Product catalogue | Phase 1 | {{PG:PRD-CAT-004}} |
| PRD-CAT-005 | Required details per category and listing quality checks | Product catalogue | Phase 1 | {{PG:PRD-CAT-005}} |
| PRD-CAT-006 | Product versions (variants) | Product catalogue | Phase 1 | {{PG:PRD-CAT-006}} |
| PRD-CAT-007 | Bundles and kits | Product catalogue | Phase 1 | {{PG:PRD-CAT-007}} |
| PRD-CAT-008 | Copying products and listing templates | Product catalogue | Phase 2 | {{PG:PRD-CAT-008}} |
| PRD-CAT-009 | Bulk upload, export and PDF catalogue | Product catalogue | Phase 1 | {{PG:PRD-CAT-009}} |
| PRD-CAT-010 | Bulk upload check report | Product catalogue | Phase 1 | {{PG:PRD-CAT-010}} |
| PRD-CAT-011 | Catalogue connection for other systems | Product catalogue | Phase 1 | {{PG:PRD-CAT-011}} |
| PRD-CAT-012 | Prices by customer group and quantity | Product catalogue | Phase 1 | {{PG:PRD-CAT-012}} |
| PRD-CAT-013 | Call for price (request a quote) | Product catalogue | Phase 1 | {{PG:PRD-CAT-013}} |
| PRD-CAT-014 | Product tax category | Product catalogue | Phase 1 | {{PG:PRD-CAT-014}} |
| PRD-CAT-015 | Export and customs details | Product catalogue | Phase 1 | {{PG:PRD-CAT-015}} |
| PRD-CAT-016 | Product pictures and media | Product catalogue | Phase 1 | {{PG:PRD-CAT-016}} |
| PRD-CAT-017 | Product content in each language | Product catalogue | Phase 1 | {{PG:PRD-CAT-017}} |
| PRD-CAT-018 | Product questions and answers | Product catalogue | Phase 2 | {{PG:PRD-CAT-018}} |
| PRD-CAT-019 | Regulated products and certificates | Product catalogue | Phase 2 | {{PG:PRD-CAT-019}} |
| PRD-CAT-020 | Origin and product story | Product catalogue | Phase 1 | {{PG:PRD-CAT-020}} |
| PRD-CAT-021 | Listing policy checks and reports | Product catalogue | Phase 1 | {{PG:PRD-CAT-021}} |
| PRD-CAT-022 | Listing stages and approval | Product catalogue | Phase 1 | {{PG:PRD-CAT-022}} |
| PRD-CAT-023 | Listing version history and autosave | Product catalogue | Phase 1 | {{PG:PRD-CAT-023}} |
| PRD-CAT-024 | Listing availability and withdrawal | Product catalogue | Phase 1 | {{PG:PRD-CAT-024}} |
| PRD-CAT-025 | Out-of-date listing alerts | Product catalogue | Phase 2 | {{PG:PRD-CAT-025}} |
| PRD-CAT-026 | Service listings | Product catalogue | Phase 1 | {{PG:PRD-CAT-026}} |
| PRD-CAT-027 | Service booking | Product catalogue | Phase 1 | {{PG:PRD-CAT-027}} |
| PRD-CAT-028 | Listing map location | Product catalogue | Phase 2 | {{PG:PRD-CAT-028}} |
| PRD-CAT-029 | Product reviews and ratings | Product catalogue | Phase 1 | {{PG:PRD-CAT-029}} |
| PRD-CAT-030 | Non-returnable products | Product catalogue | Phase 1 | {{PG:PRD-CAT-030}} |
| PRD-CAT-031 | Delivery promise on the product page | Product catalogue | Phase 1 | {{PG:PRD-CAT-031}} |
| PRD-CAT-032 | Catalogue change record | Product catalogue | Phase 2 | {{PG:PRD-CAT-032}} |
| PRD-CAT-033 | Paid featured listings | Product catalogue | Phase 1 | {{PG:PRD-CAT-033}} |
| PRD-CAT-034 | Catalogue analytics | Product catalogue | Phase 1 | {{PG:PRD-CAT-034}} |
| PRD-CAT-035 | Product feeds to other marketplaces | Product catalogue | Phase 2 | {{PG:PRD-CAT-035}} |
| PRD-CAT-036 | Product ranges by buyer group | Product catalogue | Phase 1 | {{PG:PRD-CAT-036}} |
| PRD-CAT-037 | Order quantity rules | Product catalogue | Phase 2 | {{PG:PRD-CAT-037}} |
| PRD-CAT-038 | Guided listing form for sellers | Product catalogue | Phase 1 | {{PG:PRD-CAT-038}} |
| PRD-CAT-039 | Customer and company price lists | Product catalogue | Phase 1 | {{PG:PRD-CAT-039}} |
| PRD-CAT-040 | Company-specific product range | Product catalogue | Phase 2 | {{PG:PRD-CAT-040}} |
| PRD-CAT-041 | Units of measure and pack selling | Product catalogue | Phase 1 | {{PG:PRD-CAT-041}} |
| PRD-CAT-042 | Fixed prices per currency | Product catalogue | Phase 1 | {{PG:PRD-CAT-042}} |
| PRD-CAT-043 | Seller listing review | Product catalogue | Phase 1 | {{PG:PRD-CAT-043}} |
| PRD-INV-001 | Stock tracking | Inventory and warehouses | Phase 1 | {{PG:PRD-INV-001}} |
| PRD-INV-002 | Stock in several warehouses | Inventory and warehouses | Phase 1 | {{PG:PRD-INV-002}} |
| PRD-INV-003 | Low-stock levels and alerts | Inventory and warehouses | Phase 1 | {{PG:PRD-INV-003}} |
| PRD-INV-004 | Stock hold while the customer pays | Inventory and warehouses | Phase 1 | {{PG:PRD-INV-004}} |
| PRD-INV-005 | Stock corrections with reasons | Inventory and warehouses | Phase 1 | {{PG:PRD-INV-005}} |
| PRD-INV-006 | Goods receiving | Inventory and warehouses | Phase 1 | {{PG:PRD-INV-006}} |
| PRD-INV-007 | Warehouse transfers | Inventory and warehouses | Phase 2 | {{PG:PRD-INV-007}} |
| PRD-INV-008 | Cycle counts | Inventory and warehouses | Phase 2 | {{PG:PRD-INV-008}} |
| PRD-INV-009 | Batch and lot tracking | Inventory and warehouses | Phase 2 | {{PG:PRD-INV-009}} |
| PRD-INV-010 | Serial number tracking | Inventory and warehouses | Phase 2 | {{PG:PRD-INV-010}} |
| PRD-INV-011 | Expiry management | Inventory and warehouses | Phase 2 | {{PG:PRD-INV-011}} |
| PRD-INV-012 | Stock link with the warehouse or ERP system | Inventory and warehouses | Phase 1 | {{PG:PRD-INV-012}} |
| PRD-INV-013 | Stock reports | Inventory and warehouses | Phase 1 | {{PG:PRD-INV-013}} |
| PRD-SRC-001 | Keyword search | Search, discovery and merchandising | Phase 1 | {{PG:PRD-SRC-001}} |
| PRD-SRC-002 | Suggestions while typing | Search, discovery and merchandising | Phase 1 | {{PG:PRD-SRC-002}} |
| PRD-SRC-003 | Narrowing results | Search, discovery and merchandising | Phase 1 | {{PG:PRD-SRC-003}} |
| PRD-SRC-004 | Finding items by location and delivery option | Search, discovery and merchandising | Phase 1 | {{PG:PRD-SRC-004}} |
| PRD-SRC-005 | Sorting options | Search, discovery and merchandising | Phase 1 | {{PG:PRD-SRC-005}} |
| PRD-SRC-006 | Category browsing | Search, discovery and merchandising | Phase 1 | {{PG:PRD-SRC-006}} |
| PRD-SRC-007 | Promotions, collections and campaign pages | Search, discovery and merchandising | Phase 1 | {{PG:PRD-SRC-007}} |
| PRD-SRC-008 | Rule-based suggestions | Search, discovery and merchandising | Phase 1 | {{PG:PRD-SRC-008}} |
| PRD-SRC-009 | Personalised suggestions and ranking | Search, discovery and merchandising | Phase 1 | {{PG:PRD-SRC-009}} |
| PRD-SRC-010 | Wish list | Search, discovery and merchandising | Phase 1 | {{PG:PRD-SRC-010}} |
| PRD-SRC-011 | Saved searches and watch alerts | Search, discovery and merchandising | Phase 2 | {{PG:PRD-SRC-011}} |
| PRD-SRC-012 | Search history | Search, discovery and merchandising | Phase 2 | {{PG:PRD-SRC-012}} |
| PRD-SRC-013 | Product comparison | Search, discovery and merchandising | Phase 1 | {{PG:PRD-SRC-013}} |
| PRD-SRC-014 | Enhanced search engine: relevance, synonyms and languages | Search, discovery and merchandising | Phase 1 | {{PG:PRD-SRC-014}} |
| PRD-SRC-015 | Trending and best sellers | Search, discovery and merchandising | Phase 2 | {{PG:PRD-SRC-015}} |
| PRD-SRC-016 | Category structure control | Search, discovery and merchandising | Phase 1 | {{PG:PRD-SRC-016}} |
| PRD-SRC-017 | Seller badges and featured sellers | Search, discovery and merchandising | Phase 1 | {{PG:PRD-SRC-017}} |
| PRD-SRC-018 | Delivery promise on product cards | Search, discovery and merchandising | Phase 1 | {{PG:PRD-SRC-018}} |
| PRD-SRC-019 | Which products appear in search | Search, discovery and merchandising | Phase 1 | {{PG:PRD-SRC-019}} |
| PRD-SRC-020 | Services area | Search, discovery and merchandising | Phase 1 | {{PG:PRD-SRC-020}} |
| PRD-SRC-021 | Web analytics | Search, discovery and merchandising | Phase 1 | {{PG:PRD-SRC-021}} |
| PRD-SRC-022 | Accessible search and menus | Search, discovery and merchandising | Phase 1 | {{PG:PRD-SRC-022}} |
| PRD-SRC-023 | Search on weak connections | Search, discovery and merchandising | Phase 1 | {{PG:PRD-SRC-023}} |
| PRD-SRC-024 | Search for other channels | Search, discovery and merchandising | Phase 1 | {{PG:PRD-SRC-024}} |
| PRD-SRC-025 | One search for everything | Search, discovery and merchandising | Phase 2 | {{PG:PRD-SRC-025}} |
| PRD-SRC-026 | Search speed and up-to-date results | Search, discovery and merchandising | Phase 2 | {{PG:PRD-SRC-026}} |
| PRD-SRC-027 | Shop conveniences | Search, discovery and merchandising | Phase 2 | {{PG:PRD-SRC-027}} |
| PRD-CHK-001 | Shopping cart | Cart and checkout | Phase 1 | {{PG:PRD-CHK-001}} |
| PRD-CHK-002 | Checkout | Cart and checkout | Phase 1 | {{PG:PRD-CHK-002}} |
| PRD-CHK-003 | Final checks before ordering | Cart and checkout | Phase 1 | {{PG:PRD-CHK-003}} |
| PRD-CHK-004 | One checkout for several sellers | Cart and checkout | Phase 1 | {{PG:PRD-CHK-004}} |
| PRD-CHK-005 | Delivery or pickup for each item | Cart and checkout | Phase 1 | {{PG:PRD-CHK-005}} |
| PRD-CHK-006 | Delivery time window and instructions | Cart and checkout | Phase 1 | {{PG:PRD-CHK-006}} |
| PRD-CHK-007 | Addresses without street numbers | Cart and checkout | Phase 1 | {{PG:PRD-CHK-007}} |
| PRD-CHK-008 | Reliable checkout on unreliable networks | Cart and checkout | Phase 1 | {{PG:PRD-CHK-008}} |
| PRD-CHK-009 | Buyer protection and legal notices | Cart and checkout | Phase 1 | {{PG:PRD-CHK-009}} |
| PRD-CHK-010 | Minimum order and free delivery thresholds | Cart and checkout | Phase 1 | {{PG:PRD-CHK-010}} |
| PRD-CHK-011 | Cart restriction rules | Cart and checkout | Phase 1 | {{PG:PRD-CHK-011}} |
| PRD-CHK-012 | Pickup code or QR code | Cart and checkout | Phase 1 | {{PG:PRD-CHK-012}} |
| PRD-CHK-013 | Orders placed by agents | Cart and checkout | Phase 1 | {{PG:PRD-CHK-013}} |
| PRD-CHK-014 | Expected delivery date at checkout | Cart and checkout | Phase 1 | {{PG:PRD-CHK-014}} |
| PRD-CHK-015 | Extra details at checkout | Cart and checkout | Phase 1 | {{PG:PRD-CHK-015}} |
| PRD-CHK-016 | Business buying on account with credit limits | Cart and checkout | Phase 1 | {{PG:PRD-CHK-016}} |
| PRD-CHK-017 | Quick and bulk ordering for businesses | Cart and checkout | Phase 1 | {{PG:PRD-CHK-017}} |
| PRD-CHK-018 | Company purchase approval | Cart and checkout | Phase 1 | {{PG:PRD-CHK-018}} |
| PRD-CHK-019 | Order confirmation | Cart and checkout | Phase 1 | {{PG:PRD-CHK-019}} |
| PRD-PAY-001 | Choosing which payment methods to offer | Payments, tax, settlement and reconciliation | Phase 1 | {{PG:PRD-PAY-001}} |
| PRD-PAY-002 | Card payments | Payments, tax, settlement and reconciliation | Phase 1 | {{PG:PRD-PAY-002}} |
| PRD-PAY-003 | PayPal | Payments, tax, settlement and reconciliation | Phase 1 | {{PG:PRD-PAY-003}} |
| PRD-PAY-004 | Mobile money | Payments, tax, settlement and reconciliation | Phase 1 | {{PG:PRD-PAY-004}} |
| PRD-PAY-005 | Bank transfer | Payments, tax, settlement and reconciliation | Phase 1 | {{PG:PRD-PAY-005}} |
| PRD-PAY-006 | Letters of credit | Payments, tax, settlement and reconciliation | Phase 1 | {{PG:PRD-PAY-006}} |
| PRD-PAY-007 | Escrow and staged release | Payments, tax, settlement and reconciliation | Phase 1 | {{PG:PRD-PAY-007}} |
| PRD-PAY-008 | Cash on delivery and cash at an outlet | Payments, tax, settlement and reconciliation | Phase 1 | {{PG:PRD-PAY-008}} |
| PRD-PAY-009 | Wallet and store credit | Payments, tax, settlement and reconciliation | Phase 1 | {{PG:PRD-PAY-009}} |
| PRD-PAY-010 | Split payments | Payments, tax, settlement and reconciliation | Phase 1 | {{PG:PRD-PAY-010}} |
| PRD-PAY-011 | Payment status | Payments, tax, settlement and reconciliation | Phase 1 | {{PG:PRD-PAY-011}} |
| PRD-PAY-012 | Charged only once | Payments, tax, settlement and reconciliation | Phase 1 | {{PG:PRD-PAY-012}} |
| PRD-PAY-013 | Payment receipts | Payments, tax, settlement and reconciliation | Phase 1 | {{PG:PRD-PAY-013}} |
| PRD-PAY-014 | Payment reconciliation | Payments, tax, settlement and reconciliation | Phase 1 | {{PG:PRD-PAY-014}} |
| PRD-PAY-015 | Payment fees | Payments, tax, settlement and reconciliation | Phase 1 | {{PG:PRD-PAY-015}} |
| PRD-PAY-016 | Refunds | Payments, tax, settlement and reconciliation | Phase 1 | {{PG:PRD-PAY-016}} |
| PRD-PAY-017 | Chargebacks | Payments, tax, settlement and reconciliation | Phase 1 | {{PG:PRD-PAY-017}} |
| PRD-PAY-018 | Fraud and risk controls | Payments, tax, settlement and reconciliation | Phase 1 | {{PG:PRD-PAY-018}} |
| PRD-PAY-019 | Payments operations screen | Payments, tax, settlement and reconciliation | Phase 1 | {{PG:PRD-PAY-019}} |
| PRD-PAY-020 | Tax calculation | Payments, tax, settlement and reconciliation | Phase 1 | {{PG:PRD-PAY-020}} |
| PRD-PAY-021 | Tax on fees and tax reports | Payments, tax, settlement and reconciliation | Phase 1 | {{PG:PRD-PAY-021}} |
| PRD-PAY-022 | Bulk payouts | Payments, tax, settlement and reconciliation | Phase 3 | {{PG:PRD-PAY-022}} |
| PRD-PAY-023 | Paying in another currency | Payments, tax, settlement and reconciliation | Phase 1 | {{PG:PRD-PAY-023}} |
| PRD-PAY-024 | Standard payment provider connection | Payments, tax, settlement and reconciliation | Phase 1 | {{PG:PRD-PAY-024}} |
| PRD-PAY-025 | Electronic tax invoicing | Payments, tax, settlement and reconciliation | Phase 1 | {{PG:PRD-PAY-025}} |
| PRD-PAY-026 | Kenya Revenue Authority eTIMS connection | Payments, tax, settlement and reconciliation | Phase 1 | {{PG:PRD-PAY-026}} |
| PRD-PAY-027 | Malawi Revenue Authority EIS connection | Payments, tax, settlement and reconciliation | Phase 1 | {{PG:PRD-PAY-027}} |
| PRD-PAY-028 | M-Pesa (Kenya) | Payments, tax, settlement and reconciliation | Phase 1 | {{PG:PRD-PAY-028}} |
| PRD-PAY-029 | TNM Mpamba | Payments, tax, settlement and reconciliation | Phase 1 | {{PG:PRD-PAY-029}} |
| PRD-PAY-030 | Airtel Money | Payments, tax, settlement and reconciliation | Phase 1 | {{PG:PRD-PAY-030}} |
| PRD-PAY-031 | KTDA bank card gateway | Payments, tax, settlement and reconciliation | Phase 1 | {{PG:PRD-PAY-031}} |
| PRD-PAY-032 | Malawi Post card gateway | Payments, tax, settlement and reconciliation | Phase 1 | {{PG:PRD-PAY-032}} |
| PRD-PAY-033 | Amounts owed by credit customers | Payments, tax, settlement and reconciliation | Phase 1 | {{PG:PRD-PAY-033}} |
| PRD-PAY-034 | Outlet receipts and end-of-shift cash-up | Payments, tax, settlement and reconciliation | Phase 1 | {{PG:PRD-PAY-034}} |
| PRD-PAY-035 | Direct payment to the seller | Payments, tax, settlement and reconciliation | Phase 2 | {{PG:PRD-PAY-035}} |
| PRD-PAY-036 | Confirming payments made outside the platform | Payments, tax, settlement and reconciliation | Phase 2 | {{PG:PRD-PAY-036}} |
| PRD-ORD-001 | Order management console | Orders, quotations and contracts | Phase 1 | {{PG:PRD-ORD-001}} |
| PRD-ORD-002 | Configurable order stages | Orders, quotations and contracts | Phase 1 | {{PG:PRD-ORD-002}} |
| PRD-ORD-003 | Order changes with reasons and audit | Orders, quotations and contracts | Phase 1 | {{PG:PRD-ORD-003}} |
| PRD-ORD-004 | Cancellation rules | Orders, quotations and contracts | Phase 1 | {{PG:PRD-ORD-004}} |
| PRD-ORD-005 | Seller order processing | Orders, quotations and contracts | Phase 1 | {{PG:PRD-ORD-005}} |
| PRD-ORD-006 | Partial fulfilment approval | Orders, quotations and contracts | Phase 1 | {{PG:PRD-ORD-006}} |
| PRD-ORD-007 | Order numbering | Orders, quotations and contracts | Phase 1 | {{PG:PRD-ORD-007}} |
| PRD-ORD-008 | Reorder | Orders, quotations and contracts | Phase 1 | {{PG:PRD-ORD-008}} |
| PRD-ORD-009 | Invoices | Orders, quotations and contracts | Phase 1 | {{PG:PRD-ORD-009}} |
| PRD-ORD-010 | Order holds | Orders, quotations and contracts | Phase 1 | {{PG:PRD-ORD-010}} |
| PRD-ORD-011 | Cut-offs and service levels | Orders, quotations and contracts | Phase 1 | {{PG:PRD-ORD-011}} |
| PRD-ORD-012 | Request for quotation | Orders, quotations and contracts | Phase 1 | {{PG:PRD-ORD-012}} |
| PRD-ORD-013 | Quote negotiation and conversion | Orders, quotations and contracts | Phase 1 | {{PG:PRD-ORD-013}} |
| PRD-ORD-014 | Seller offers | Orders, quotations and contracts | Phase 1 | {{PG:PRD-ORD-014}} |
| PRD-ORD-015 | Request forms with approval workflows | Orders, quotations and contracts | Phase 1 | {{PG:PRD-ORD-015}} |
| PRD-ORD-016 | Contract drafting | Orders, quotations and contracts | Phase 1 | {{PG:PRD-ORD-016}} |
| PRD-ORD-017 | Contract e-signature | Orders, quotations and contracts | Phase 2 | {{PG:PRD-ORD-017}} |
| PRD-ORD-018 | Contract amendments | Orders, quotations and contracts | Phase 2 | {{PG:PRD-ORD-018}} |
| PRD-ORD-019 | Contract repository | Orders, quotations and contracts | Phase 2 | {{PG:PRD-ORD-019}} |
| PRD-ORD-020 | Award and acceptance letters | Orders, quotations and contracts | Phase 2 | {{PG:PRD-ORD-020}} |
| PRD-ORD-021 | Performance securities | Orders, quotations and contracts | Phase 3 | {{PG:PRD-ORD-021}} |
| PRD-ORD-022 | Contract-to-order execution | Orders, quotations and contracts | Phase 1 | {{PG:PRD-ORD-022}} |
| PRD-ORD-023 | Group buying | Orders, quotations and contracts | Phase 2 | {{PG:PRD-ORD-023}} |
| PRD-ORD-024 | Scheme applications | Orders, quotations and contracts | Phase 3 | {{PG:PRD-ORD-024}} |
| PRD-ORD-025 | Proforma invoice | Orders, quotations and contracts | Phase 1 | {{PG:PRD-ORD-025}} |
| PRD-ORD-026 | Incoterms | Orders, quotations and contracts | Phase 1 | {{PG:PRD-ORD-026}} |
| PRD-ORD-027 | Sample orders | Orders, quotations and contracts | Phase 2 | {{PG:PRD-ORD-027}} |
| PRD-ORD-028 | Recurring and subscription orders | Orders, quotations and contracts | Phase 2 | {{PG:PRD-ORD-028}} |
| PRD-LOG-001 | Shipping methods and rates | Shipping, delivery and fulfilment | Phase 1 | {{PG:PRD-LOG-001}} |
| PRD-LOG-002 | Delivery fee rules | Shipping, delivery and fulfilment | Phase 1 | {{PG:PRD-LOG-002}} |
| PRD-LOG-003 | Pickup points and outlets | Shipping, delivery and fulfilment | Phase 1 | {{PG:PRD-LOG-003}} |
| PRD-LOG-004 | Delivery coverage rules | Shipping, delivery and fulfilment | Phase 1 | {{PG:PRD-LOG-004}} |
| PRD-LOG-005 | Expected delivery dates | Shipping, delivery and fulfilment | Phase 1 | {{PG:PRD-LOG-005}} |
| PRD-LOG-006 | DHL connection | Shipping, delivery and fulfilment | Phase 1 | {{PG:PRD-LOG-006}} |
| PRD-LOG-007 | Shipping labels and barcodes | Shipping, delivery and fulfilment | Phase 1 | {{PG:PRD-LOG-007}} |
| PRD-LOG-008 | Fulfilment allocation and routing | Shipping, delivery and fulfilment | Phase 1 | {{PG:PRD-LOG-008}} |
| PRD-LOG-009 | Warehouse pick, pack and dispatch | Shipping, delivery and fulfilment | Phase 1 | {{PG:PRD-LOG-009}} |
| PRD-LOG-010 | Shipments | Shipping, delivery and fulfilment | Phase 1 | {{PG:PRD-LOG-010}} |
| PRD-LOG-011 | Postal work tasks and seller collections | Shipping, delivery and fulfilment | Phase 1 | {{PG:PRD-LOG-011}} |
| PRD-LOG-012 | Proof of delivery record | Shipping, delivery and fulfilment | Phase 1 | {{PG:PRD-LOG-012}} |
| PRD-LOG-013 | Delivery problems | Shipping, delivery and fulfilment | Phase 1 | {{PG:PRD-LOG-013}} |
| PRD-LOG-014 | Cash on delivery reconciliation | Shipping, delivery and fulfilment | Phase 1 | {{PG:PRD-LOG-014}} |
| PRD-LOG-015 | Address checking and map location | Shipping, delivery and fulfilment | Phase 1 | {{PG:PRD-LOG-015}} |
| PRD-LOG-016 | Cross-border shipping | Shipping, delivery and fulfilment | Phase 1 | {{PG:PRD-LOG-016}} |
| PRD-LOG-017 | Storage charges and changes before dispatch | Shipping, delivery and fulfilment | Phase 1 | {{PG:PRD-LOG-017}} |
| PRD-LOG-018 | Delivery performance indicators | Shipping, delivery and fulfilment | Phase 1 | {{PG:PRD-LOG-018}} |
| PRD-LOG-019 | Cold-chain and hazardous goods | Shipping, delivery and fulfilment | Phase 3 | {{PG:PRD-LOG-019}} |
| PRD-LOG-020 | International postal tracking numbers (S10) | Shipping, delivery and fulfilment | Phase 1 | {{PG:PRD-LOG-020}} |
| PRD-LOG-021 | Standard courier connection | Shipping, delivery and fulfilment | Phase 1 | {{PG:PRD-LOG-021}} |
| PRD-LOG-022 | Post-office drop-off acceptance | Shipping, delivery and fulfilment | Phase 1 | {{PG:PRD-LOG-022}} |
| PRD-LOG-023 | Hub-and-spoke sorting | Shipping, delivery and fulfilment | Phase 1 | {{PG:PRD-LOG-023}} |
| PRD-LOG-024 | Last-mile delivery lists and attempts | Shipping, delivery and fulfilment | Phase 1 | {{PG:PRD-LOG-024}} |
| PRD-LOG-025 | FedEx connection | Shipping, delivery and fulfilment | Phase 1 | {{PG:PRD-LOG-025}} |
| PRD-LOG-026 | G4S connection | Shipping, delivery and fulfilment | Phase 1 | {{PG:PRD-LOG-026}} |
| PRD-LOG-027 | Skynet connection | Shipping, delivery and fulfilment | Phase 1 | {{PG:PRD-LOG-027}} |
| PRD-LOG-028 | Wells Fargo (Kenya) connection | Shipping, delivery and fulfilment | Phase 1 | {{PG:PRD-LOG-028}} |
| PRD-LOG-029 | Aramex connection | Shipping, delivery and fulfilment | Phase 1 | {{PG:PRD-LOG-029}} |
| PRD-LOG-030 | Shipping lines and agents connection | Shipping, delivery and fulfilment | Phase 1 | {{PG:PRD-LOG-030}} |
| PRD-LOG-031 | Malawi Post delivery partner connections | Shipping, delivery and fulfilment | Phase 1 | {{PG:PRD-LOG-031}} |
| PRD-LOG-032 | Own-fleet proof of delivery | Shipping, delivery and fulfilment | Phase 1 | {{PG:PRD-LOG-032}} |
| PRD-TRK-001 | Shipment tracking for buyers | Tracking and customer messages | Phase 1 | {{PG:PRD-TRK-001}} |
| PRD-TRK-002 | Tracking update hub | Tracking and customer messages | Phase 1 | {{PG:PRD-TRK-002}} |
| PRD-TRK-003 | Scanning app for mobile staff | Tracking and customer messages | Phase 1 | {{PG:PRD-TRK-003}} |
| PRD-TRK-004 | Email notifications and templates | Tracking and customer messages | Phase 1 | {{PG:PRD-TRK-004}} |
| PRD-TRK-005 | Multi-channel messaging | Tracking and customer messages | Phase 1 | {{PG:PRD-TRK-005}} |
| PRD-TRK-006 | Message preferences | Tracking and customer messages | Phase 1 | {{PG:PRD-TRK-006}} |
| PRD-TRK-007 | Message delivery records | Tracking and customer messages | Phase 1 | {{PG:PRD-TRK-007}} |
| PRD-TRK-008 | In-app notification list | Tracking and customer messages | Phase 2 | {{PG:PRD-TRK-008}} |
| PRD-TRK-009 | Service notices and disruption banners | Tracking and customer messages | Phase 1 | {{PG:PRD-TRK-009}} |
| PRD-TRK-010 | Shipment view for sellers | Tracking and customer messages | Phase 1 | {{PG:PRD-TRK-010}} |
| PRD-TRK-011 | Order status check for guests | Tracking and customer messages | Phase 1 | {{PG:PRD-TRK-011}} |
| PRD-TRK-012 | Delivery and pickup messages | Tracking and customer messages | Phase 1 | {{PG:PRD-TRK-012}} |
| PRD-RET-001 | Return requests | Returns, refunds and disputes | Phase 1 | {{PG:PRD-RET-001}} |
| PRD-RET-002 | Return eligibility rules | Returns, refunds and disputes | Phase 1 | {{PG:PRD-RET-002}} |
| PRD-RET-003 | Return delivery | Returns, refunds and disputes | Phase 1 | {{PG:PRD-RET-003}} |
| PRD-RET-004 | Return inspection | Returns, refunds and disputes | Phase 1 | {{PG:PRD-RET-004}} |
| PRD-RET-005 | Automatic refunds | Returns, refunds and disputes | Phase 1 | {{PG:PRD-RET-005}} |
| PRD-RET-006 | Return fees | Returns, refunds and disputes | Phase 1 | {{PG:PRD-RET-006}} |
| PRD-RET-007 | Dispute and issue cases | Returns, refunds and disputes | Phase 1 | {{PG:PRD-RET-007}} |
| PRD-RET-008 | Dispute time limits and escalation | Returns, refunds and disputes | Phase 1 | {{PG:PRD-RET-008}} |
| PRD-RET-009 | Case retention and reports | Returns, refunds and disputes | Phase 1 | {{PG:PRD-RET-009}} |
| PRD-RET-010 | Seller return review | Returns, refunds and disputes | Phase 1 | {{PG:PRD-RET-010}} |
| PRD-RET-011 | Buyer and seller mediation | Returns, refunds and disputes | Phase 1 | {{PG:PRD-RET-011}} |
| PRD-CRM-001 | Help desk ticketing | Customer service, help desk and chat | Phase 1 | {{PG:PRD-CRM-001}} |
| PRD-CRM-002 | Multi-channel case intake | Customer service, help desk and chat | Phase 1 | {{PG:PRD-CRM-002}} |
| PRD-CRM-003 | Agent 360° view | Customer service, help desk and chat | Phase 1 | {{PG:PRD-CRM-003}} |
| PRD-CRM-004 | Complaints process | Customer service, help desk and chat | Phase 1 | {{PG:PRD-CRM-004}} |
| PRD-CRM-005 | Support quality analytics | Customer service, help desk and chat | Phase 1 | {{PG:PRD-CRM-005}} |
| PRD-CRM-006 | Ticket collaboration and audit | Customer service, help desk and chat | Phase 1 | {{PG:PRD-CRM-006}} |
| PRD-CRM-007 | Knowledge base | Customer service, help desk and chat | Phase 1 | {{PG:PRD-CRM-007}} |
| PRD-CRM-008 | Live web chat | Customer service, help desk and chat | Phase 1 | {{PG:PRD-CRM-008}} |
| PRD-CRM-009 | Contact and messaging | Customer service, help desk and chat | Phase 1 | {{PG:PRD-CRM-009}} |
| PRD-CRM-010 | Fraud reporting and referral | Customer service, help desk and chat | Phase 1 | {{PG:PRD-CRM-010}} |
| PRD-CRM-011 | Experience feedback | Customer service, help desk and chat | Phase 1 | {{PG:PRD-CRM-011}} |
| PRD-CRM-012 | Support channel directory | Customer service, help desk and chat | Phase 2 | {{PG:PRD-CRM-012}} |
| PRD-CRM-013 | Community forums | Customer service, help desk and chat | Phase 3 | {{PG:PRD-CRM-013}} |
| PRD-CRM-014 | Issue routing and escalation | Customer service, help desk and chat | Phase 1 | {{PG:PRD-CRM-014}} |
| PRD-CRM-015 | B2B account management | Customer service, help desk and chat | Phase 2 | {{PG:PRD-CRM-015}} |
| PRD-MKT-001 | Discounts and coupons | Marketing, promotions, loyalty, content and SEO | Phase 1 | {{PG:PRD-MKT-001}} |
| PRD-MKT-002 | Advanced promotions | Marketing, promotions, loyalty, content and SEO | Phase 1 | {{PG:PRD-MKT-002}} |
| PRD-MKT-003 | Reward points | Marketing, promotions, loyalty, content and SEO | Phase 1 | {{PG:PRD-MKT-003}} |
| PRD-MKT-004 | Gift cards and vouchers | Marketing, promotions, loyalty, content and SEO | Phase 1 | {{PG:PRD-MKT-004}} |
| PRD-MKT-005 | Newsletter and e-mail campaigns | Marketing, promotions, loyalty, content and SEO | Phase 1 | {{PG:PRD-MKT-005}} |
| PRD-MKT-006 | On-site pop-ups | Marketing, promotions, loyalty, content and SEO | Phase 1 | {{PG:PRD-MKT-006}} |
| PRD-MKT-007 | Content management | Marketing, promotions, loyalty, content and SEO | Phase 1 | {{PG:PRD-MKT-007}} |
| PRD-MKT-008 | Content approval and policy versioning | Marketing, promotions, loyalty, content and SEO | Phase 1 | {{PG:PRD-MKT-008}} |
| PRD-MKT-009 | SEO | Marketing, promotions, loyalty, content and SEO | Phase 1 | {{PG:PRD-MKT-009}} |
| PRD-MKT-010 | Marketing tags and social | Marketing, promotions, loyalty, content and SEO | Phase 1 | {{PG:PRD-MKT-010}} |
| PRD-MKT-011 | Customer segmentation attributes | Marketing, promotions, loyalty, content and SEO | Phase 1 | {{PG:PRD-MKT-011}} |
| PRD-MKT-012 | Abandoned-cart recovery | Marketing, promotions, loyalty, content and SEO | Phase 2 | {{PG:PRD-MKT-012}} |
| PRD-MKT-013 | Affiliates and referrals | Marketing, promotions, loyalty, content and SEO | Phase 2 | {{PG:PRD-MKT-013}} |
| PRD-MKT-014 | Seller-managed pricing and promotions | Marketing, promotions, loyalty, content and SEO | Phase 1 | {{PG:PRD-MKT-014}} |
| PRD-RPT-001 | Standard reports and dashboard | Reporting and analytics | Phase 1 | {{PG:PRD-RPT-001}} |
| PRD-RPT-002 | KPI framework and executive dashboards | Reporting and analytics | Phase 1 | {{PG:PRD-RPT-002}} |
| PRD-RPT-003 | Data warehouse | Reporting and analytics | Phase 1 | {{PG:PRD-RPT-003}} |
| PRD-RPT-004 | Report delivery and self-service | Reporting and analytics | Phase 1 | {{PG:PRD-RPT-004}} |
| PRD-RPT-005 | Report access control | Reporting and analytics | Phase 1 | {{PG:PRD-RPT-005}} |
| PRD-RPT-006 | Compliance and audit reports | Reporting and analytics | Phase 1 | {{PG:PRD-RPT-006}} |
| PRD-RPT-007 | Public transparency dashboard | Reporting and analytics | Phase 3 | {{PG:PRD-RPT-007}} |
| PRD-RPT-008 | External BI connectivity | Reporting and analytics | Phase 2 | {{PG:PRD-RPT-008}} |
| PRD-RPT-009 | Operator performance metrics | Reporting and analytics | Phase 2 | {{PG:PRD-RPT-009}} |
| PRD-RPT-010 | Operational dashboards | Reporting and analytics | Phase 1 | {{PG:PRD-RPT-010}} |
| PRD-RPT-011 | Commerce and marketing analytics | Reporting and analytics | Phase 1 | {{PG:PRD-RPT-011}} |
| PRD-RPT-012 | e-Government and engagement reports | Reporting and analytics | Phase 1 | {{PG:PRD-RPT-012}} |
| PRD-ADM-001 | Administration console | Administration, workflow and operations console | Phase 1 | {{PG:PRD-ADM-001}} |
| PRD-ADM-002 | Workflow engine | Administration, workflow and operations console | Phase 1 | {{PG:PRD-ADM-002}} |
| PRD-ADM-003 | Business rules engine | Administration, workflow and operations console | Phase 1 | {{PG:PRD-ADM-003}} |
| PRD-ADM-004 | Transaction types and their required information | Administration, workflow and operations console | Phase 2 | {{PG:PRD-ADM-004}} |
| PRD-ADM-005 | Eligibility and quota rules | Administration, workflow and operations console | Phase 2 | {{PG:PRD-ADM-005}} |
| PRD-ADM-006 | Approval queues | Administration, workflow and operations console | Phase 1 | {{PG:PRD-ADM-006}} |
| PRD-ADM-007 | Operations console and work queues | Administration, workflow and operations console | Phase 1 | {{PG:PRD-ADM-007}} |
| PRD-ADM-008 | Upload and content scanning controls | Administration, workflow and operations console | Phase 1 | {{PG:PRD-ADM-008}} |
| PRD-ADM-009 | Exception management | Administration, workflow and operations console | Phase 2 | {{PG:PRD-ADM-009}} |
| PRD-ADM-010 | Operational alerts | Administration, workflow and operations console | Phase 2 | {{PG:PRD-ADM-010}} |
| PRD-ADM-011 | Template library | Administration, workflow and operations console | Phase 2 | {{PG:PRD-ADM-011}} |
| PRD-ADM-012 | Template analytics and shared marketplace | Administration, workflow and operations console | Phase 3 | {{PG:PRD-ADM-012}} |
| PRD-DOC-001 | Document generation | Documents and records | Phase 1 | {{PG:PRD-DOC-001}} |
| PRD-DOC-002 | Document storage | Documents and records | Phase 1 | {{PG:PRD-DOC-002}} |
| PRD-DOC-003 | Document integrity | Documents and records | Phase 2 | {{PG:PRD-DOC-003}} |
| PRD-DOC-004 | Document review and compliance export | Documents and records | Phase 2 | {{PG:PRD-DOC-004}} |
| PRD-DOC-005 | Document requirements and validation | Documents and records | Phase 2 | {{PG:PRD-DOC-005}} |
| PRD-DOC-006 | Export document set | Documents and records | Phase 1 | {{PG:PRD-DOC-006}} |
| PRD-SEC-001 | Encryption and transport security | Security, audit and compliance | Phase 1 | {{PG:PRD-SEC-001}} |
| PRD-SEC-002 | Edge protection | Security, audit and compliance | Phase 1 | {{PG:PRD-SEC-002}} |
| PRD-SEC-003 | PCI-DSS scope control | Security, audit and compliance | Phase 1 | {{PG:PRD-SEC-003}} |
| PRD-SEC-004 | Platform audit trail | Security, audit and compliance | Phase 1 | {{PG:PRD-SEC-004}} |
| PRD-SEC-005 | Anomaly and correlation detection | Security, audit and compliance | Phase 2 | {{PG:PRD-SEC-005}} |
| PRD-SEC-006 | Data residency | Security, audit and compliance | Phase 1 | {{PG:PRD-SEC-006}} |
| PRD-SEC-007 | Consent and privacy tools | Security, audit and compliance | Phase 1 | {{PG:PRD-SEC-007}} |
| PRD-SEC-008 | Breach notification workflow | Security, audit and compliance | Phase 1 | {{PG:PRD-SEC-008}} |
| PRD-SEC-009 | Compliance reports and certificates | Security, audit and compliance | Phase 2 | {{PG:PRD-SEC-009}} |
| PRD-SEC-010 | Auditor read-only access | Security, audit and compliance | Phase 2 | {{PG:PRD-SEC-010}} |
| PRD-SEC-011 | Vulnerability management | Security, audit and compliance | Phase 1 | {{PG:PRD-SEC-011}} |
| PRD-SEC-012 | Country data-protection pack | Security, audit and compliance | Phase 1 | {{PG:PRD-SEC-012}} |
| PRD-SEC-013 | Bot protection | Security, audit and compliance | Phase 1 | {{PG:PRD-SEC-013}} |
| PRD-SEC-014 | Data classification and masking | Security, audit and compliance | Phase 2 | {{PG:PRD-SEC-014}} |
| PRD-SEC-015 | Security incident management | Security, audit and compliance | Phase 2 | {{PG:PRD-SEC-015}} |
| PRD-INT-001 | Secure connection service for other systems and apps | Connections with other systems | Phase 1 | {{PG:PRD-INT-001}} |
| PRD-INT-002 | Integration gateway | Connections with other systems | Phase 1 | {{PG:PRD-INT-002}} |
| PRD-INT-003 | Automatic notifications to other systems | Connections with other systems | Phase 1 | {{PG:PRD-INT-003}} |
| PRD-INT-004 | Integration health and retries | Connections with other systems | Phase 1 | {{PG:PRD-INT-004}} |
| PRD-INT-005 | ERP and finance connector framework | Connections with other systems | Phase 1 | {{PG:PRD-INT-005}} |
| PRD-INT-006 | SAGE 200 adapter | Connections with other systems | Phase 1 | {{PG:PRD-INT-006}} |
| PRD-INT-007 | PostGlobal adapter | Connections with other systems | Phase 1 | {{PG:PRD-INT-007}} |
| PRD-INT-008 | Banking integrations | Connections with other systems | Phase 1 | {{PG:PRD-INT-008}} |
| PRD-INT-009 | Government system connector framework | Connections with other systems | Phase 1 | {{PG:PRD-INT-009}} |
| PRD-INT-010 | Master data synchronisation | Connections with other systems | Phase 1 | {{PG:PRD-INT-010}} |
| PRD-INT-011 | Add-on modules | Connections with other systems | Phase 1 | {{PG:PRD-INT-011}} |
| PRD-INT-012 | Punch-out | Connections with other systems | Phase 3 | {{PG:PRD-INT-012}} |
| PRD-INT-013 | MANEPS adapter | Connections with other systems | Phase 1 | {{PG:PRD-INT-013}} |
| PRD-CHN-001 | Native mobile apps | Channels: mobile app, installable website, USSD, SMS, WhatsApp and assisted service | Phase 1 | {{PG:PRD-CHN-001}} |
| PRD-CHN-002 | Installable website and low-bandwidth mode | Channels: mobile app, installable website, USSD, SMS, WhatsApp and assisted service | Phase 1 | {{PG:PRD-CHN-002}} |
| PRD-CHN-003 | USSD channel | Channels: mobile app, installable website, USSD, SMS, WhatsApp and assisted service | Phase 1 | {{PG:PRD-CHN-003}} |
| PRD-CHN-004 | Voice menus and automated calls (IVR) | Channels: mobile app, installable website, USSD, SMS, WhatsApp and assisted service | Phase 2 | {{PG:PRD-CHN-004}} |
| PRD-CHN-005 | SMS gateway and SMS commands | Channels: mobile app, installable website, USSD, SMS, WhatsApp and assisted service | Phase 1 | {{PG:PRD-CHN-005}} |
| PRD-CHN-006 | WhatsApp Business | Channels: mobile app, installable website, USSD, SMS, WhatsApp and assisted service | Phase 1 | {{PG:PRD-CHN-006}} |
| PRD-CHN-007 | WeChat | Channels: mobile app, installable website, USSD, SMS, WhatsApp and assisted service | Phase 1 | {{PG:PRD-CHN-007}} |
| PRD-CHN-008 | Telegram bot | Channels: mobile app, installable website, USSD, SMS, WhatsApp and assisted service | Phase 3 | {{PG:PRD-CHN-008}} |
| PRD-CHN-009 | Agent and correspondent networks | Channels: mobile app, installable website, USSD, SMS, WhatsApp and assisted service | Phase 2 | {{PG:PRD-CHN-009}} |
| PRD-CHN-010 | Agent mobile app for remote work | Channels: mobile app, installable website, USSD, SMS, WhatsApp and assisted service | Phase 2 | {{PG:PRD-CHN-010}} |
| PRD-CHN-011 | Social media integration | Channels: mobile app, installable website, USSD, SMS, WhatsApp and assisted service | Phase 1 | {{PG:PRD-CHN-011}} |
| PRD-CHN-012 | SMS sender ID and opt-out | Channels: mobile app, installable website, USSD, SMS, WhatsApp and assisted service | Phase 2 | {{PG:PRD-CHN-012}} |
| PRD-CHN-013 | Push notifications | Channels: mobile app, installable website, USSD, SMS, WhatsApp and assisted service | Phase 2 | {{PG:PRD-CHN-013}} |
| PRD-AI-001 | AI translation | AI capabilities | Phase 3 | {{PG:PRD-AI-001}} |
| PRD-AI-002 | AI listing assistance | AI capabilities | Phase 3 | {{PG:PRD-AI-002}} |
| PRD-AI-003 | AI chatbot | AI capabilities | Phase 1 | {{PG:PRD-AI-003}} |
| PRD-AI-004 | AI drafting and summarisation | AI capabilities | Phase 3 | {{PG:PRD-AI-004}} |
| PRD-AI-005 | OCR and ID document checks | AI capabilities | Phase 2 | {{PG:PRD-AI-005}} |
| PRD-AI-006 | ML fraud detection | AI capabilities | Phase 3 | {{PG:PRD-AI-006}} |
| PRD-AI-007 | ML recommendation engine | AI capabilities | Phase 3 | {{PG:PRD-AI-007}} |
| PRD-AI-008 | Forecasting and image inspection | AI capabilities | Phase 3 | {{PG:PRD-AI-008}} |
| PRD-AI-009 | AI contract and letter drafting | AI capabilities | Phase 3 | {{PG:PRD-AI-009}} |
| PRD-AI-010 | AI governance | AI capabilities | Phase 1 | {{PG:PRD-AI-010}} |
| PRD-FIN-001 | Credit marketplace | Financial products | Phase 3 | {{PG:PRD-FIN-001}} |
| PRD-FIN-002 | Invoice discounting | Financial products | Phase 3 | {{PG:PRD-FIN-002}} |
| PRD-FIN-003 | Insurance | Financial products | Phase 3 | {{PG:PRD-FIN-003}} |
| PRD-FIN-004 | Subsidies and incentives | Financial products | Phase 3 | {{PG:PRD-FIN-004}} |
| PRD-FIN-005 | Financial and partner services catalogue | Financial products | Phase 1 | {{PG:PRD-FIN-005}} |
| PRD-EGV-001 | e-Government service catalogue | e-Government and service catalogue (optional pack) | Phase 1 | {{PG:PRD-EGV-001}} |
| PRD-EGV-002 | Service applications | e-Government and service catalogue (optional pack) | Phase 1 | {{PG:PRD-EGV-002}} |
| PRD-EGV-003 | Appointments | e-Government and service catalogue (optional pack) | Phase 1 | {{PG:PRD-EGV-003}} |
| PRD-EGV-004 | Document delivery | e-Government and service catalogue (optional pack) | Phase 1 | {{PG:PRD-EGV-004}} |
| PRD-EGV-005 | Government fee collection | e-Government and service catalogue (optional pack) | Phase 1 | {{PG:PRD-EGV-005}} |
| PRD-EGV-006 | Agency administration | e-Government and service catalogue (optional pack) | Phase 1 | {{PG:PRD-EGV-006}} |
| PRD-EGV-007 | Digital ID service workflows | e-Government and service catalogue (optional pack) | Phase 1 | {{PG:PRD-EGV-007}} |
| PRD-SVC-001 | Service pricing models | Services commerce (booking, delivery and completion of services) | Phase 2 | {{PG:PRD-SVC-001}} |
| PRD-SVC-002 | Service providers and resources | Services commerce (booking, delivery and completion of services) | Phase 2 | {{PG:PRD-SVC-002}} |
| PRD-SVC-003 | Booking changes, cancellations and no-shows | Services commerce (booking, delivery and completion of services) | Phase 2 | {{PG:PRD-SVC-003}} |
| PRD-SVC-004 | Deposits and advance payment for bookings | Services commerce (booking, delivery and completion of services) | Phase 2 | {{PG:PRD-SVC-004}} |
| PRD-SVC-005 | Service order lifecycle and completion sign-off | Services commerce (booking, delivery and completion of services) | Phase 1 | {{PG:PRD-SVC-005}} |
| PRD-SVC-006 | Service location at booking | Services commerce (booking, delivery and completion of services) | Phase 2 | {{PG:PRD-SVC-006}} |
| PRD-SVC-007 | Digital products and downloads | Services commerce (booking, delivery and completion of services) | Phase 2 | {{PG:PRD-SVC-007}} |
| PRD-SVC-008 | Rental and hire | Services commerce (booking, delivery and completion of services) | Phase 2 | {{PG:PRD-SVC-008}} |
| PRD-SVC-009 | Service vouchers and e-tickets | Services commerce (booking, delivery and completion of services) | Phase 2 | {{PG:PRD-SVC-009}} |
| PRD-SVC-010 | Service reminders and follow-up | Services commerce (booking, delivery and completion of services) | Phase 2 | {{PG:PRD-SVC-010}} |
| PRD-SVC-011 | Service-level targets for service orders | Services commerce (booking, delivery and completion of services) | Phase 1 | {{PG:PRD-SVC-011}} |
| PRD-SVC-012 | Service reports | Services commerce (booking, delivery and completion of services) | Phase 2 | {{PG:PRD-SVC-012}} |

# Appendix B. Glossary

| Term | Meaning |
|---|---|
| Acceptance criterion | A testable condition that a feature must meet; listed in the developer Product PRD. |
| Agent | A person who serves customers on the client's behalf, for example at a post office or outlet. |
| Always included | Part of the product in every installation, whatever packs a client uses. |
| B2B | Business to business: sales to companies and other organisations. |
| B2C | Business to consumer: sales to individual shoppers. |
| Back office | The staff side of the platform, where catalogue, orders, payments and settings are managed. |
| Configuration pack | A set of settings that can be applied in one step: for the whole product, a country, an industry or one client. |
| Decision (ref) | A pending choice by the client, the Product Owner or the technical lead. References such as FG-06 point to the Decisions, gaps and open items register. |
| e-Government (G2C, G2B) | Government services to citizens (G2C) and to businesses (G2B). |
| Escrow | Funds held by a third party until the buyer confirms delivery. |
| KYC | Know your customer: checking the identity of a customer or seller. |
| Letter of credit | A bank guarantee that a seller will be paid once the agreed documents are presented. |
| Marketplace | A shop where independent sellers list and sell their own products. |
| MFA | Multi-factor sign-in: a password plus a second check, such as a code sent to a phone. |
| Optional pack | A group of features switched on only for clients that need them. |
| PCI-DSS | The card industry's data security standard. |
| Phase | The release in which a feature is planned: phase 1, 2 or 3. |
| Product Owner | The person accountable for the product and for the order in which features are built. |
| Proposed | A design choice made by the product team that the Product Owner or client still has to confirm. |
| RFQ | Request for quotation: a buyer asks for a price before ordering. |
| UAT | User acceptance testing: testing by the client before the platform goes live. |
| USSD | A menu service on basic mobile phones, used by dialling a short code. |
| WCAG 2.1 AA | The international web accessibility guidelines, level AA. |
