# L2 Module PRD — FIN: Financial products

<!-- Single source. The Word file is generated from this Markdown by tools/md2docx.py. -->

## 1. Document control

| Item | Value |
|---|---|
| Module | FIN — Financial products |
| Version | 1.0 |
| Status | Draft. Not approved. |

**How to read the labels.** Every story, rule and criterion names its basis: **D** = the feature description; **REQ-…** = a client requirement delivered by that feature; **FC-…** = a catalog feature; **FIT** = verified nopCommerce 5.00.1 behaviour; a decision ID. "see XXX-nnn (REQ-…)" points to a requirement delivered by another feature. **Proposed** = a product design choice that needs Product Owner approval. "Not stated in source — requires confirmation" marks a value the product does not fix; developers do not fill it. Gap IDs: KG-nn = KTDA, MG-nn = Malawi Post.

## 2. Purpose and scope

Connects the shop to partner financial institutions so that buyers and sellers can reach credit, invoice discounting and insurance offered by banks, lenders and insurers; applies programme subsidies at the time of purchase; and lets Malawi Post list financial and partner services (agency banking, insurance, bill payment, ticketing) in its catalogue. Lending decisions, credit scoring, policy issuance and claim settlement stay in the partner systems: the product shares data only with the customer's consent, shows offers, records status returned by the partner, and applies the platform-side effects (repayment deductions from seller settlements, assignment of receivables, insurance premiums).

**In scope**

- Partner registry, partner products and consented data sharing with lenders (FIN-001)
- Credit offers, referral to the lender, status intake and repayment deduction from seller settlements (FIN-001)
- Invoice discounting: offering an open on-account invoice to a partner lender and recording assignment and early payment (FIN-002)
- Insurance: transit insurance at checkout, partner insurance products, policy and claim status intake (FIN-003)
- Subsidies and incentives applied at purchase for eligible customers, with budget control and claim reporting (FIN-004)
- Financial and partner services catalogue with information, hand-off and integrated fulfilment modes (FIN-005)

**Not in this module**

| Item | Where it is |
|---|---|
| Loan origination, credit scoring, loan disbursement and collection | External: partner lender systems (fit: Not implementable in nopCommerce, FIN-001) |
| Purchase of invoices and collection from the buyer | External: partner lender or factoring platform (FIN-002) |
| Policy issuance, underwriting and claim settlement | External: partner insurer systems (FIN-003) |
| Seller settlement calculation, statements and payouts | SEL module (PRD-SEL-017) — FIN-001 adds the repayment deduction line it applies |
| Accounts receivable, statements and ageing | PAY module (PRD-PAY-033) — FIN-002 calls IC-PAY-08 LockForOffer, Assign and ReleaseLock (SM-PAY-09) |
| Refund money movement | PAY module (PRD-PAY-016) |
| Scheme applications, eligibility review and approval within budget | ORD module (PRD-ORD-024) — FIN-004 applies the approved subsidy at purchase |
| Bulk disbursement of scheme payments | PAY module (PRD-PAY-022) |
| Service vouchers and e-tickets (ticketing services) | SVC module (PRD-SVC-009) |
| Separate browsing area for operator services | SRC module (PRD-SRC-020) |
| Country data-protection profile and consent texts | SEC module (PRD-SEC-012) |
| Payment-service and e-money licensing position | Decision LIC-01 (legal; inference, not stated in source) |

## 3. Feature summary

| PRD ID | Feature | Channel | Phase | Implementation | Code change | Pack | Depends on | Held by |
|---|---|---|---|---|---|---|---|---|
| PRD-FIN-001 | Credit marketplace | B2B + B2C | P3 | External system | External system + integration plugin | Agri-finance and schemes pack | | |
| PRD-FIN-002 | Invoice discounting | B2B + B2C | P3 | External system | External system + integration plugin | Agri-finance and schemes pack | | |
| PRD-FIN-003 | Insurance | B2B + B2C | P3 | External system | External system + integration plugin | Agri-finance and schemes pack | | |
| PRD-FIN-004 | Subsidies and incentives | G2C / G2B | P3 | Code-level | Custom plugin | Agri-finance and schemes pack | | |
| PRD-FIN-005 | Financial and partner services catalogue | G2C / G2B | P1 | Code-level | Custom plugin + External system + integration plugin | e-Government pack | | FG-06, T-MISS |

## 4. Actors and permissions

| Actor | What they do in this module | Role in nopCommerce |
|---|---|---|
| Seller | Sees credit offers, consents to data sharing, applies through the lender, offers open invoices for discounting, sees repayment deductions | Vendors (native) + IAM-007 |
| Buyer (shopper or business buyer) | Sees credit and insurance offers, buys transit insurance at checkout, opens insurance claims, receives subsidies | Registered (native); B2B role (IAM-022) |
| Member of finance staff | Registers partners and partner products, monitors referrals, repayments, invoice financing and policies | Role system name "Finance" (BR-IAM-050) |
| Programme staff | Define subsidy schemes, budgets and eligibility sources; run subsidy claim reports | Role system name "Programme" (BR-IAM-050) |
| Client administrator | Lists partner services, sets fulfilment mode, enters partner credentials, switches services on or off per store | Administrators (native) |
| Partner lender (system) | Receives consented data and applications; returns decisions, loan status and repayment instructions | External system via FIN connector |
| Partner insurer (system) | Returns premium quotes, policy numbers and claim status | External system via FIN connector |
| Partner service provider (system) | Validates customer account references and fulfils paid partner services (for example a bill payment) | External system via FIN connector |
| Programme registry (system) | Confirms whether a customer is eligible for a subsidy scheme | External system (not named) via FIN connector |

| Permission (system name) | Category | Allows | Default roles |
|---|---|---|---|
| FinancialServices.Partners.View | Configuration | View partners, partner products, connector status and consent records | Administrators, Finance |
| FinancialServices.Partners.CreateEditDelete | Configuration | Create and edit partners, partner products, fulfilment modes and data-sharing scopes; enter partner credentials | Administrators |
| FinancialServices.Referrals.View | Orders | View credit referrals, invoice-financing records, insurance policies and claims, partner fulfilments | Administrators, Finance |
| FinancialServices.Repayments.CreateEditDelete | Orders | Record, suspend or correct repayment instructions and deductions (always with a reason, audited) | Finance |
| FinancialServices.Subsidies.View | Promotions | View subsidy schemes, budgets and the claim report | Administrators, Programme, Finance |
| FinancialServices.Subsidies.CreateEditDelete | Promotions | Create and change subsidy schemes, budgets and eligibility sources | Programme |

Permissions are declared in the FIN plugin class implementing IPermissionConfigManager (pattern: Misc.RFQ RfqPermissionConfigManager). System names use the plugin prefix and the native view / create-edit-delete split (unchanged in 5.00.1: Libraries/Nop.Services/Security/StandardPermission.cs); Category is taken from the native set (Configuration, Orders, Promotions). Default roles are given by role system name, spelled exactly as in the IAM product role catalogue BR-IAM-050 (Finance and Programme are in it). The IAM plugin creates every missing catalogue role (BR-IAM-050); the FIN plugin does not rely on native start-up to create them. Partner services in the catalogue (FIN-005) and subsidy discounts (FIN-004) are native products and discounts: editing them uses the native Catalog.ProductsCreateEditDelete and Promotions.DiscountsCreateEditDelete permissions; no FIN duplicate is created. Seller and buyer actions (consent, apply, offer an invoice, open a claim) are storefront or seller-portal actions limited to the customer's own data or the vendor's own orders. All names are Proposed.

### 4.1 Standard permission criteria

| ID | Criterion | Basis |
|---|---|---|
| AC-FIN-PERM-01 | **Given** a user without FinancialServices.Partners.View, **when** they open or post any function it guards, **then** access is denied and nothing changes; **given** a user with it, the function is available. | Proposed (T-05) |
| AC-FIN-PERM-02 | **Given** a user without FinancialServices.Partners.CreateEditDelete, **when** they open or post any function it guards, **then** access is denied and nothing changes; **given** a user with it, the function is available. | Proposed (T-05) |
| AC-FIN-PERM-03 | **Given** a user without FinancialServices.Referrals.View, **when** they open or post any function it guards, **then** access is denied and nothing changes; **given** a user with it, the function is available. | Proposed (T-05) |
| AC-FIN-PERM-04 | **Given** a user without FinancialServices.Repayments.CreateEditDelete, **when** they open or post any function it guards, **then** access is denied and nothing changes; **given** a user with it, the function is available. | Proposed (T-05) |
| AC-FIN-PERM-05 | **Given** a user without FinancialServices.Subsidies.View, **when** they open or post any function it guards, **then** access is denied and nothing changes; **given** a user with it, the function is available. | Proposed (T-05) |
| AC-FIN-PERM-06 | **Given** a user without FinancialServices.Subsidies.CreateEditDelete, **when** they open or post any function it guards, **then** access is denied and nothing changes; **given** a user with it, the function is available. | Proposed (T-05) |

## 5. Source traceability

Traceability of this module to client requirements and catalog features, and requirement coverage, are in the separate traceability document. Each acceptance criterion below names its basis.


## 6. nopCommerce 5.00 baseline and build approach

| PRD ID | Native capability in 5.00.1 | Gap / to build | Code change | Evidence | Confidence |
|---|---|---|---|---|---|
| PRD-FIN-001 | None. [5.00.1: no change found; 4.90 evidence paths exist in 5.00.1: No credit component in src] | Lender loan-origination/credit-scoring systems; nopCommerce needs data-sharing API, offer display and repayment deduction from vendor settlement. | External system + integration plugin | Paths are given in the native-capability column (source tag release-5.00.1) | Not found in source — inference: lending is a partner system |
| PRD-FIN-002 | None. [5.00.1: no change found; 4.90 evidence paths exist in 5.00.1: No component in src] | Lender/factoring platform; nopCommerce shares invoice data and records early-payment status. | External system + integration plugin | Paths are given in the native-capability column (source tag release-5.00.1) | Not found in source — inference: factoring is a partner system |
| PRD-FIN-003 | Insurance could be sold as a product or checkout attribute (CheckoutAttribute) but no policy/claims handling. [5.00.1: no change found; 4.90 evidence paths exist in 5.00.1: src/Libraries/Nop.Core/Domain/Orders/CheckoutAttribute.cs] | Insurer systems for policy issuance and claims; integration plugin. | External system + integration plugin | Paths are given in the native-capability column (source tag release-5.00.1) | Not found in source — inference: claims handling belongs to the insurer |
| PRD-FIN-004 | Discounts limited by customer role (DiscountRules.CustomerRoles) unchanged; new 5.00 price lists by customer or customer role with fixed/percentage/amount prices and dates (Libraries/Nop.Core/Domain/PriceLists/PriceList.cs, PriceListCustomerRole.cs) can also model subsidised prices. | Eligibility check against programme registries, subsidy display and claim reporting. | Custom plugin | Paths are given in the native-capability column (source tag release-5.00.1) | Verified in 4.90.8 source; re-verified in 5.00.1 source |
| PRD-FIN-005 | Catalog (categories, non-shipping products, topics) can list services. [5.00.1: no change found; 4.90 evidence paths exist in 5.00.1: src/Libraries/Nop.Core/Domain/Catalog/Product.cs; src/Libraries/Nop.Core/Domain/Topics/Topic.cs] | Partner-service catalogue with hand-off/integration to agency banking, bill payment, ticketing providers (list not provided). | Custom plugin + External system + integration plugin | Paths are given in the native-capability column (source tag release-5.00.1) | Verified in 4.90.8 source; re-verified in 5.00.1 source |


## 7. Feature specifications


### 7.1 PRD-FIN-001 Credit marketplace

| Item | Value |
|---|---|
| Description (baseline) | Partners such as banks offer loans to buyers or sellers on the platform, using platform data to judge eligibility, with repayment taken from sales. |
| Why it matters | Small businesses get access to finance. |
| Who benefits | Sellers; small buyers |
| Phase | P3 |
| Implementation | External system — External system + integration plugin |
| Depends on | — |
| Status | Ready; conditions: ONE-RECORD, CFG-01 |

**User stories**

| ID | Story | Basis | Readiness |
|---|---|---|---|
| US-FIN-001-01 | As a seller, I want to see credit offers from partner lenders and apply for one, so that my business can get working capital. | D | Ready; conditions: ONE-RECORD, CFG-01 |
| US-FIN-001-02 | As a buyer, I want to see input-credit offers from partner lenders when I buy, so that I can buy inputs now and repay later as the lender agrees. | D; FC-M14-001 | Ready; conditions: ONE-RECORD, CFG-01 |
| US-FIN-001-03 | As a seller, I want my platform data to be shared with a lender only after I agree, and to withdraw that agreement, so that I control who sees my business data. | D; FC-M14-004 | Ready; conditions: ONE-RECORD, CFG-01 |
| US-FIN-001-04 | As a member of finance staff, I want to register partner lenders and their loan products with the data each may receive, so that only approved partners receive data. | D | Ready; conditions: ONE-RECORD, CFG-01 |
| US-FIN-001-05 | As a seller, I want loan repayments agreed with the lender to be deducted from my next platform settlement, so that repayment happens without extra steps. | D; FC-M14-005 | Ready; conditions: ONE-RECORD, CFG-01 |
| US-FIN-001-06 | As a member of finance staff, I want loan decisions and status sent by the lender to be recorded against the referral, so that we can see what happened to each application. | D | Ready; conditions: ONE-RECORD, CFG-01 |

**Acceptance criteria**

| ID | Story | Criterion | Basis |
|---|---|---|---|
| AC-FIN-001-04-01 | US-FIN-001-04 | **Given** a partner lender is created with at least one loan product, target audience (sellers or buyers), and the list of data categories it may receive, **when** the partner is saved and activated, **then** it appears in the partner list with status Active; credentials are stored encrypted, flagged secret in the key catalogue of the partner adapter, refused by the pack loader and omitted from exports (BR-FIN-010, BR-PLT-013). | D; CFG-01 |
| AC-FIN-001-01-01 | US-FIN-001-01 | **Given** an Active partner has an Active loan product for sellers, **when** a seller opens the Finance page in the seller portal, **then** the product is listed with the partner name, the product name and the description supplied by the partner; the platform shows no rate, limit or decision of its own (BR-FIN-001). | D |
| AC-FIN-001-01-02 | US-FIN-001-01 | **Given** the feature state productfeature.<prd-id> of PRD-FIN-001 is off for store S (IC-PLT-02), **when** a seller of S opens the seller portal or a buyer of S views a product with a linked loan product, **then** the Finance page and the offer link are not shown, and the FIN scheduled tasks skip S (BR-FIN-011). | Proposed (IC-PLT-02, PLT) |
| AC-FIN-001-02-01 | US-FIN-001-02 | **Given** an Active partner has an Active loan product for buyers linked to a product category, **when** a buyer views a product in that category, **then** an offer link for the loan product is shown on the product page; selecting it starts the referral flow of story 01 for the buyer. | D; FC-M14-001 |
| AC-FIN-001-03-01 | US-FIN-001-03 | **Given** the seller selects Apply on a loan product, **when** the consent step opens, **then** it lists the partner, the data categories of that product and the purpose, using the consent text of the country profile (SEC-012, read through IC-SEC-03 GetProfile); nothing is sent until the seller agrees. | D; FC-M14-004; BR-FIN-002 |
| AC-FIN-001-03-02 | US-FIN-001-03 | **Given** the seller does not agree, **when** they leave or decline the consent step, **then** no data is sent, no referral is created and message Fin.ConsentRequired is shown. | Proposed |
| AC-FIN-001-03-03 | US-FIN-001-03 | **Given** the seller agrees, **when** the referral is submitted, **then** the consent is recorded through IAM IC-IAM-05 RecordAcceptance (customer, policy FinancePartnerDataSharing with the country-profile text version or "unversioned", decision accepted, partner, purpose, data categories) and FIN keeps only the returned acceptance id on the referral; a FinanceReferral is created with status Referred, the consented data set is sent through IC-FIN-01 SubmitApplication and the referral becomes Submitted (SM-FIN-01); audited (AUD-FIN-001). | D; BR-FIN-002 |
| AC-FIN-001-03-04 | US-FIN-001-03 | **Given** a consent exists, **when** the seller withdraws it in My account, **then** FIN records the withdrawal through IC-IAM-05 RecordAcceptance (decision withdrawn, same partner and purpose); before every later send FIN reads IC-IAM-05 GetActiveConsent and sends nothing to that partner; the partner is notified through IC-FIN-01 WithdrawConsent; audited (AUD-FIN-001). | Proposed; NFR-X-002; ONE-RECORD |
| AC-FIN-001-03-05 | US-FIN-001-03 | **Given** a data category is not in the loan product scope, **when** the data set is built, **then** that category is not included; only categories in the consented scope are sent (BR-FIN-002). | D; FC-M14-004 |
| AC-FIN-001-06-01 | US-FIN-001-06 | **Given** a referral is Submitted, **when** the lender posts a status (Approved, Declined, Disbursed, Closed) to the FIN callback route, **then** the callback signature or token is verified, the status is recorded with the lender reference following SM-FIN-01, and the seller is notified; an invalid callback is rejected and audited (AUD-FIN-005). | D; FIT (PayPalCommerceWebhookController pattern) |
| AC-FIN-001-05-01 | US-FIN-001-05 | **Given** a loan is Disbursed and the lender sent a repayment instruction (fixed amount or share per settlement, outstanding balance), **when** SEL-017 calculates the next settlement for that seller, **then** FIN has supplied the charge through IC-SEL-05 AddSellerCharge (source type RepaymentDeduction, instructed amount or, for basis Share, the instructed share of the batch net, outstanding balance as cap, lender and loan reference); SEL-017 adds one deduction line capped at the lowest of the instructed amount, the outstanding balance and the batch net (BR-SEL-012, BR-FIN-003); it appears on the seller statement with the lender reference. | D; FC-M14-005 |
| AC-FIN-001-05-02 | US-FIN-001-05 | **Given** a repayment deduction is included in a paid settlement, **when** the settlement is paid, **then** the SEL event Seller.SettlementPaid (IC-SEL-07) is consumed (the consumer only enqueues a job), the deduction is reported to the lender through IC-FIN-01 ReportRepayment with the settlement reference, and the outstanding balance on the RepaymentInstruction is reduced by the deducted amount. | D; FC-M14-005 |
| AC-FIN-001-05-03 | US-FIN-001-05 | **Given** a member of finance staff suspends a repayment instruction with a reason, **when** the next settlement is calculated, **then** FIN supplies no charge through IC-SEL-05 for that loan while it is Suspended, so no deduction is made; audited (AUD-FIN-002). | Proposed |
| AC-FIN-001-06-02 | US-FIN-001-06 | **Given** the lender reports the loan Closed, **when** the status is received, **then** the repayment instruction ends and no further deductions are made. | D |

**Business rules applied:** BR-FIN-001; BR-FIN-002; BR-FIN-003; BR-FIN-010; BR-FIN-011; BR-FIN-012; BR-FIN-013 (§8.1).


### 7.2 PRD-FIN-002 Invoice discounting

| Item | Value |
|---|---|
| Description (baseline) | Sellers get paid early by selling their unpaid invoices to a lender at a discount. |
| Why it matters | Improves sellers' cash flow. |
| Who benefits | Sellers |
| Phase | P3 |
| Implementation | External system — External system + integration plugin |
| Depends on | — |
| Status | Ready |

**User stories**

| ID | Story | Basis | Readiness |
|---|---|---|---|
| US-FIN-002-01 | As a seller, I want to offer an unpaid invoice of a business buyer to a partner lender and be paid early at a discount, so that my cash flow improves. | D; FC-M14-003 | Ready |
| US-FIN-002-02 | As a member of finance staff, I want the receivable to show that it was assigned to the lender and who the buyer must pay, so that payments are not lost or paid twice. | D; FC-M14-003 | Ready |
| US-FIN-002-03 | As a business buyer, I want my statement to show whom I must pay for an assigned invoice, so that I pay the right party. | D; FC-M14-003 | Ready |

**Acceptance criteria**

| ID | Story | Criterion | Basis |
|---|---|---|---|
| AC-FIN-002-01-01 | US-FIN-002-01 | **Given** an on-account invoice has a receivable in PAY-033 state Open (SM-PAY-09) payable to the seller, is not disputed and is not Offered or Assigned, **when** the seller opens Invoice discounting, **then** the invoice is listed as eligible with amount, due date and buyer name; invoices outside these conditions are not listed (BR-FIN-004). | D; FC-M14-003 |
| AC-FIN-002-01-02 | US-FIN-002-01 | **Given** the seller selects an eligible invoice and an Active discounting partner, and agrees to the consent step, **when** the request is submitted, **then** FIN calls IC-PAY-08 LockForOffer and the receivable becomes Offered (SM-PAY-09); an InvoiceFinancing record is created with status Offered and the invoice data and PDF (ORD-009) are sent through IC-FIN-01 ShareInvoice (SM-FIN-02); if LockForOffer is refused (not open, already offered or assigned, disputed) no record is created and nothing is sent. | D; FC-M14-003; BR-FIN-002 |
| AC-FIN-002-02-01 | US-FIN-002-02 | **Given** an invoice is Offered, **when** the lender reports acceptance with the advance amount, the discount and its remit-to details, **then** the record becomes Financed; FIN calls IC-PAY-08 Assign with the lender and its remit-to details and the receivable becomes Assigned with the lender as payee (SM-PAY-09); the early payment to the seller is made by the lender outside the platform; audited (AUD-FIN-003). | D; FC-M14-003 |
| AC-FIN-002-02-02 | US-FIN-002-02 | **Given** an invoice is Offered, **when** the lender declines, **then** the record becomes Declined and FIN calls IC-PAY-08 ReleaseLock, so the receivable is Open again (SM-PAY-09). | D |
| AC-FIN-002-03-01 | US-FIN-002-03 | **Given** a receivable is Assigned, **when** the buyer opens the statement (PAY-033), **then** the invoice shows the lender as the party to pay and its remit-to details instead of the seller (PAY-033 statement, payee on the receivable). | D; FC-M14-003 |
| AC-FIN-002-02-03 | US-FIN-002-02 | **Given** a payment for an Assigned receivable is received by the client instead of the lender, **when** it is allocated (PAY-033), **then** the allocation is flagged "assigned — not for seller payout" by PAY (BR-PAY-131) and listed for finance staff to forward to the lender; it is not paid out to the seller (BR-FIN-004). | Proposed |
| AC-FIN-002-02-04 | US-FIN-002-02 | **Given** the lender reports that the buyer paid, **when** the status is received, **then** the InvoiceFinancing record becomes Settled with the lender reference and FIN calls IC-PAY-08 AllocateExternal with the reported amount and the lender reference, so the PAY-033 receivable becomes Settled when allocations reach its full amount (SM-PAY-09). | D |

**Business rules applied:** BR-FIN-002; BR-FIN-004; BR-FIN-011; BR-FIN-012; BR-FIN-013 (§8.1).


### 7.3 PRD-FIN-003 Insurance

| Item | Value |
|---|---|
| Description (baseline) | Offers insurance for goods in transit, equipment or crops, and handles claims. |
| Why it matters | Reduces risk for buyers, sellers and farmers. |
| Who benefits | Sellers; farmers |
| Phase | P3 |
| Implementation | External system — External system + integration plugin |
| Depends on | — |
| Status | Ready |

**User stories**

| ID | Story | Basis | Readiness |
|---|---|---|---|
| US-FIN-003-01 | As a buyer, I want to add insurance for goods in transit when I place an order, so that I am covered if the goods are lost or damaged on the way. | D; FC-M14-007 | Ready |
| US-FIN-003-02 | As a seller or farmer, I want to buy equipment or crop insurance from a partner insurer through the shop, so that I can protect my assets and harvest. | D; FC-M14-008 | Ready |
| US-FIN-003-03 | As a policy holder, I want to open a claim with evidence and follow its status until the insurer settles it, so that I know where my claim stands. | D; FC-M14-009 | Ready |
| US-FIN-003-04 | As a member of finance staff, I want each sold policy to be issued by the insurer and recorded against the order, so that every premium collected has a policy. | D | Ready |

**Acceptance criteria**

| ID | Story | Criterion | Basis |
|---|---|---|---|
| AC-FIN-003-01-01 | US-FIN-003-01 | **Given** transit insurance is configured as a checkout attribute linked to a partner insurer, with the premium rule supplied by the insurer, **when** the buyer reaches the confirm step, **then** the option is shown with its premium and the insurer name; when selected the premium is added to the order total (native CheckoutAttribute price adjustment). | D; FC-M14-007; FIT (CheckoutAttribute) |
| AC-FIN-003-01-02 | US-FIN-003-01 | **Given** transit insurance is configured with a fixed premium per option value, **when** the buyer selects an option and places the order, **then** the order total includes exactly that premium and the order records the selected option in its checkout attributes. | FIT (CheckoutAttributeValue.PriceAdjustment) |
| AC-FIN-003-04-01 | US-FIN-003-04 | **Given** an order with transit insurance becomes Paid (OrderPaidEvent), **when** the event is handled, **then** the consumer only enqueues an issue job; the scheduled task calls IC-FIN-02 IssuePolicy and stores the policy number on an InsurancePolicy record linked to the order (SM-FIN-03); the buyer receives it by the order notification channels (TRK-005). | D; FIT (L1 §6.2 principle 8) |
| AC-FIN-003-04-02 | US-FIN-003-04 | **Given** policy issuance fails after the configured retries, **when** the last retry fails, **then** the policy becomes Failed, finance staff are alerted, and FIN calls IC-RET-04 RaiseRefundTrigger with source type PolicyIssueFailed, the order line or checkout-attribute share that carried the premium and the amount FIN computes (the premium paid for that policy) (BR-FIN-005). | Proposed; RET-005 (IC-RET-04) |
| AC-FIN-003-04-03 | US-FIN-003-04 | **Given** an insured order is cancelled or fully refunded before dispatch, **when** the refund completes (PAY-016), **then** the policy is cancelled through IC-FIN-02 CancelPolicy and the premium is part of the refund. | Proposed |
| AC-FIN-003-02-01 | US-FIN-003-02 | **Given** a partner insurance product (equipment or crop) is listed in the partner services catalogue (FIN-005), **when** a seller or farmer selects it, **then** the FIN-005 hand-off or integrated mode applies; for integrated mode the policy request is sent through IC-FIN-02 IssuePolicy and the result stored as in story 04. | D; FC-M14-008 |
| AC-FIN-003-03-01 | US-FIN-003-03 | **Given** an Issued policy exists, **when** the policy holder opens a claim with a description and at least one evidence file, **then** an InsuranceClaim is created with status Submitted, files are stored as Download records, and the claim is sent through IC-FIN-02 SubmitClaim (SM-FIN-04). | D; FC-M14-009 |
| AC-FIN-003-03-02 | US-FIN-003-03 | **Given** a claim is Submitted, **when** the insurer posts a status (UnderReview, Approved with amount, Rejected with reason, Settled), **then** the verified status is recorded and shown to the policy holder in My account; settlement money moves outside the platform. | D; FC-M14-009 |
| AC-FIN-003-03-03 | US-FIN-003-03 | **Given** a user who is not the policy holder, **when** opens the claim page or its evidence files, **then** access is denied (BR-FIN-006). | Proposed |

**Business rules applied:** BR-FIN-002; BR-FIN-005; BR-FIN-006; BR-FIN-011; BR-FIN-012; BR-FIN-013 (§8.1).


### 7.4 PRD-FIN-004 Subsidies and incentives

| Item | Value |
|---|---|
| Description (baseline) | Shows buyers any government or programme subsidies they qualify for when buying. |
| Why it matters | Makes sure eligible people receive support. |
| Who benefits | Farmers; programme staff |
| Phase | P3 |
| Implementation | Code-level — Custom plugin |
| Depends on | — |
| Status | Ready; conditions: OVR-REG |

**User stories**

| ID | Story | Basis | Readiness |
|---|---|---|---|
| US-FIN-004-01 | As a member of programme staff, I want to define a subsidy scheme with eligible people, eligible items, subsidy amount, dates and budget, so that support reaches the intended groups. | D; FC-M14-011 | Ready; conditions: OVR-REG |
| US-FIN-004-02 | As a buyer who is eligible, I want to see the subsidy I qualify for and get it when I buy, so that I pay only my share. | D; FC-M14-011 | Ready; conditions: OVR-REG |
| US-FIN-004-03 | As a member of programme staff, I want eligibility to be confirmed against the programme registry, so that only eligible people receive the subsidy. | D | Ready; conditions: OVR-REG |
| US-FIN-004-04 | As a member of programme staff, I want a claim report of subsidies granted per scheme, so that the programme funder can reimburse the client. | D | Ready; conditions: OVR-REG |

**Acceptance criteria**

| ID | Story | Criterion | Basis |
|---|---|---|---|
| AC-FIN-004-01-01 | US-FIN-004-01 | **Given** programme staff create a scheme with eligible customer role, eligible products or categories, fixed or percentage subsidy, start and end dates and a budget amount, **when** the scheme is saved, **then** a native discount is created with the FIN subsidy requirement rule (an IDiscountRequirementRule plugin) and the native customer-role requirement; the budget is stored on the SubsidyScheme; audited (AUD-FIN-004). | D; FC-M14-011; FIT (DiscountRules.CustomerRoles, IDiscountRequirementRule) |
| AC-FIN-004-02-01 | US-FIN-004-02 | **Given** a buyer is in the eligible role and the scheme has budget left, **when** the buyer views an eligible product and adds it to the cart, **then** the subsidy is shown as a separate line labelled with the scheme name and deducted from the price; the order records the scheme and the subsidy amount. | D; FC-M14-011 |
| AC-FIN-004-02-02 | US-FIN-004-02 | **Given** granting the subsidy would exceed the remaining budget, **when** the cart is calculated, **then** the FIN requirement rule fails, no subsidy is applied and message Fin.SubsidyBudgetExhausted is shown (BR-FIN-007). | Proposed |
| AC-FIN-004-02-03 | US-FIN-004-02 | **Given** two buyers place orders that together would exceed the remaining budget, **when** both orders are placed at the same time, **then** the FIN placement participant (IC-CHK-06 Reserve, called by the CHK-003 PlaceOrderAsync override) reserves the subsidy under ILocker key 'fin-scheme-{SchemeId}'; the second Reserve is refused with message Fin.SubsidyBudgetExhausted and that placement is refused; Confirm consumes the reserved amount and Release returns it (BR-FIN-007). | Proposed; OVR-REG (CHK-004) |
| AC-FIN-004-03-01 | US-FIN-004-03 | **Given** a customer applies for eligibility (through ORD-024 or the scheme page) with the identifiers the registry needs, **when** the registry check returns Eligible through IC-FIN-04 CheckEligibility, **then** the customer is added to the scheme role with the expiry date returned or configured; Not eligible leaves the roles unchanged and shows message Fin.NotEligible. | D |
| AC-FIN-004-03-02 | US-FIN-004-03 | **Given** an eligibility expires, **when** the daily FIN task runs, **then** the customer is removed from the scheme role and no subsidy applies from then on. | Proposed |
| AC-FIN-004-04-01 | US-FIN-004-04 | **Given** orders with subsidies exist, **when** programme staff run the claim report for a scheme and period, **then** each subsidised order line is listed with customer, product, subsidy amount and order status; refunded lines are shown as reversals; the report exports to file. | D |
| AC-FIN-004-04-02 | US-FIN-004-04 | **Given** an order with a subsidy is refunded in part or in full (PAY-016), **when** the refund completes, **then** the subsidy amount for the refunded share is returned to the scheme budget (BR-FIN-007); a cancelled order returns its whole subsidy. | Proposed |

**Business rules applied:** BR-FIN-007; BR-FIN-011; BR-FIN-012; BR-FIN-013 (§8.1).


### 7.5 PRD-FIN-005 Financial and partner services catalogue

| Item | Value |
|---|---|
| Description (baseline) | A catalogue of financial and partner services such as agency banking, insurance, bill payment and ticketing. (The Malawi Post list of these services has not been provided yet.) |
| Why it matters | Turns the post-office network into a one-stop service point. |
| Who benefits | Malawi Post customers |
| Phase | P1 |
| Implementation | Code-level — Custom plugin + External system + integration plugin |
| Depends on | — |
| Status | On hold: FG-06, T-MISS |

**User stories**

| ID | Story | Basis | Readiness |
|---|---|---|---|
| US-FIN-005-01 | As a Malawi Post customer, I want to browse financial and partner services such as agency banking, insurance, bill payment and ticketing in the shop, so that I can use the post office as a one-stop service point. | D; REQ-MPC-FR-336 | On hold: FG-06, T-MISS |
| US-FIN-005-02 | As a client administrator, I want to add a partner service with how it is fulfilled — information only, hand-off to the partner, or integrated with the partner system, so that each service works the way the partner offers it. | D | On hold: FG-06, T-MISS |
| US-FIN-005-03 | As a Malawi Post customer, I want to pay a partner service such as a bill in the shop and receive the partner confirmation, so that the service is completed in one visit. | D; REQ-MPC-FR-336 | On hold: FG-06, T-MISS |
| US-FIN-005-04 | As a client administrator, I want to switch each partner service on or off per store without code, so that services follow the client rollout decisions. | REQ-MPC-FR-336 | On hold: FG-06, T-MISS |

**Acceptance criteria**

| ID | Story | Criterion | Basis |
|---|---|---|---|
| AC-FIN-005-01-01 | US-FIN-005-01 | **Given** partner services are set up as products with shipping disabled (IsShipEnabled off) in a partner-services category, each linked to a partner, **when** a customer opens the category or searches, **then** each service is shown with name, partner, description, and fee or price where one applies. | REQ-MPC-FR-336; FIT (Product, Category, Topic) |
| AC-FIN-005-02-01 | US-FIN-005-02 | **Given** a service is in mode Information only, **when** the customer opens it, **then** the description and partner contact are shown and the buy button is disabled (native DisableBuyButton). | D; FIT |
| AC-FIN-005-02-02 | US-FIN-005-02 | **Given** a service is in mode Hand-off, **when** the customer selects Continue with partner, **then** the partner URL opens with the referral reference and the referral is recorded (partner, service, customer if signed in, time). | D; Proposed |
| AC-FIN-005-03-01 | US-FIN-005-03 | **Given** a service is in mode Integrated with a required account-reference text attribute and, where the partner allows, a customer-entered amount (native CustomerEntersPrice), **when** the customer enters the reference, **then** the reference is validated through IC-FIN-03 ValidateAccount before add to cart; an invalid reference shows message Fin.AccountInvalid. | REQ-MPC-FR-336; FIT (AttributeControlType.TextBox, Product.CustomerEntersPrice) |
| AC-FIN-005-03-02 | US-FIN-005-03 | **Given** an order line of an Integrated service becomes Paid (OrderPaidEvent), **when** the event is handled, **then** the consumer only enqueues a fulfilment job; the task calls IC-FIN-03 Fulfil; on success the PartnerFulfilment becomes Fulfilled, the partner receipt reference is stored on the order line, added as an order note and shown to the customer (SM-FIN-05). | D; FIT (L1 §6.2 principle 8) |
| AC-FIN-005-03-03 | US-FIN-005-03 | **Given** fulfilment fails after the configured retries, **when** the last retry fails, **then** the fulfilment becomes Failed, finance staff are alerted and FIN calls IC-RET-04 RaiseRefundTrigger with source type PartnerFulfilmentFailed, the order line and the amount FIN computes (the amount paid for that line) (BR-FIN-005). | Proposed; RET-005 (IC-RET-04) |
| AC-FIN-005-04-01 | US-FIN-005-04 | **Given** a partner service is unpublished, or not mapped to a store, **when** a customer browses that store, **then** the service is not shown and cannot be bought there (native Published and StoreMapping). | REQ-MPC-FR-336; FIT |
| AC-FIN-005-01-02 | US-FIN-005-01 | **Given** the service is ticketing, **when** the customer pays, **then** when SVC-009 (P2) is delivered the e-ticket is issued by SVC-009 (see SVC-009 (REQ-MPC-FR-336)); until then (P1) ticketing services are not offered for sale, because no e-ticket can be issued. | D; Proposed (P1 behaviour) |

**Business rules applied:** BR-FIN-005; BR-FIN-008; BR-FIN-010; BR-FIN-011; BR-FIN-012; BR-FIN-013 (§8.1).


## 8. Business rules and state models

### 8.1 Business rules

| ID | Rule | Features | Basis |
|---|---|---|---|
| BR-FIN-001 | The platform shows partner credit, discounting and insurance products as supplied by the partner. It computes no credit score, rate, limit or decision of its own; decisions come only from the partner. | FIN-001, FIN-002, FIN-003 | D; FIT (external system) |
| BR-FIN-002 | No customer data is sent to a partner without a recorded consent for that partner, purpose and data scope. Only the consented data categories are sent. Consent can be withdrawn; after withdrawal nothing more is sent. | FIN-001, FIN-002, FIN-003 | D (FC-M14-004 data use); NFR-X-002; Proposed (withdrawal) |
| BR-FIN-003 | A repayment deduction on a seller settlement never exceeds the instructed amount, the outstanding loan balance or the settlement amount; deductions stop when the loan is Closed or the instruction is Suspended. | FIN-001 | FC-M14-005; Proposed (caps) |
| BR-FIN-004 | Only an open, undisputed, unassigned on-account receivable can be offered for discounting; while Offered or Financed it cannot be offered again. Money received for an Assigned receivable is not paid out to the seller. | FIN-002 | D; Proposed |
| BR-FIN-005 | When a paid partner service or insurance policy cannot be fulfilled after the configured retries, FIN raises a refund trigger through IC-RET-04 RaiseRefundTrigger with a source type registered in RET (PolicyIssueFailed, PartnerFulfilmentFailed) and the amount paid for it, computed by FIN (RET-005 is the single refund-trigger owner, which calls PAY-016); FIN never calls PAY-016 directly and never changes the order payment status. | FIN-003, FIN-005 | Proposed; RET-005 (single refund-trigger owner); FIT (PAY BR-PAY-010) |
| BR-FIN-006 | Insurance claims, their evidence files and partner references are visible only to the policy holder, finance staff and administrators. | FIN-003 | Proposed; NFR-X-002 |
| BR-FIN-007 | A subsidy is applied only while the customer is in the scheme role, the scheme is within its dates and the remaining budget covers the subsidy; refunded or cancelled subsidy amounts return to the budget. The budget is reserved and consumed at placement by the FIN placement participant (IC-CHK-06 Reserve / Confirm / Release) under ILocker key 'fin-scheme-{SchemeId}'. | FIN-004 | Proposed; FIT (ILocker); OVR-REG (CHK-004) |
| BR-FIN-008 | Partner services are ordinary products: fees and prices, store availability and publication use the native catalogue; FIN adds only the partner link, fulfilment mode and fulfilment record. | FIN-005 | FIT; D |
| BR-FIN-010 | Partner credentials are stored encrypted per client instance. Every adapter setting that holds a credential, key or token is flagged secret in the key catalogue, so the pack loader refuses it and exports omit it (BR-PLT-013). | FIN-001, FIN-005 | CFG-01; NFR-X-001; PLT (BR-PLT-013) |
| BR-FIN-011 | Every FIN page, widget, seller-portal action, callback and scheduled task checks the feature state of the PRD feature it serves through IC-PLT-02 IsEnabled (setting productfeature.<prd-id>, store value else client value) before it runs for a store; when off, nothing is shown and tasks skip that store. Partner-service products (FIN-005) are native products: switching PRD-FIN-005 off does not unpublish them; the administrator unpublishes or unmaps them (AC-FIN-005-04-01). | FIN-001 to FIN-005 | Proposed ( PLT, IC-PLT-02) |
| BR-FIN-012 | Every new FIN setting key (FinancialServicesSettings and adapter settings) is listed in the FIN plugin key catalogue with key, type, layer, secret flag and default, so pack validation accepts it (PLT-003, NFR-X-008). Keys are listed in §10. | FIN-001 to FIN-005 | Proposed ( PLT) |
| BR-FIN-013 | Every FIN notification (referral status, repayment deducted, invoice financed or declined, policy issued or failed, claim status, partner fulfilment completed or failed) is sent by TRK-005 through IC-TRK-04 SendEvent; FIN registers its event codes with IC-TRK-04 RegisterEventCode at installation (names Proposed, listed in BR-TRK-023: Fin.Core.ReferralStatusChanged, Fin.Core.RepaymentDeducted, Fin.Core.InvoiceFinancingDecided, Fin.Core.PolicyIssued, Fin.Core.PolicyIssueFailed, Fin.Core.ClaimStatusChanged, Fin.Core.PartnerFulfilmentCompleted, Fin.Core.PartnerFulfilmentFailed) and sends no message itself; customer opt-outs (TRK-006) apply. | FIN-001 to FIN-005 | Decision MSG-ROUTE; Proposed (code names) |


### 8.2 State models (Proposed)

Only the transitions listed are allowed; any other transition is rejected and logged.

| Model | Entity | From | Event | Guard | To | Side effect |
|---|---|---|---|---|---|---|
| SM-FIN-01 | FinanceReferral | (none) | customer consents and applies | consent recorded (IC-IAM-05) | Referred | acceptance id stored on the referral |
| SM-FIN-01 | FinanceReferral | Referred | application sent to the partner | — | Submitted | AUD-FIN-001 |
| SM-FIN-01 | FinanceReferral | Submitted | partner reports approval | callback verified | Approved | customer notified |
| SM-FIN-01 | FinanceReferral | Submitted | partner reports decline | callback verified | Declined | customer notified |
| SM-FIN-01 | FinanceReferral | Approved | partner reports disbursement | callback verified | Disbursed | repayment instruction stored if sent |
| SM-FIN-01 | FinanceReferral | Disbursed | partner reports loan closed | callback verified | Closed | repayment instruction ended |
| SM-FIN-02 | InvoiceFinancing | (none) | seller offers invoice | BR-FIN-004; consent recorded; IC-PAY-08 LockForOffer accepted | Offered | receivable Offered (SM-PAY-09) |
| SM-FIN-02 | InvoiceFinancing | Offered | lender accepts | callback verified | Financed | IC-PAY-08 Assign: receivable Assigned (SM-PAY-09); AUD-FIN-003 |
| SM-FIN-02 | InvoiceFinancing | Offered | lender declines | callback verified | Declined | IC-PAY-08 ReleaseLock: receivable Open (SM-PAY-09) |
| SM-FIN-02 | InvoiceFinancing | Financed | lender reports buyer paid | callback verified | Settled | receivable Settled when PAY-033 allocations reach the full amount (SM-PAY-09) |
| SM-FIN-03 | InsurancePolicy | (none) | order with insurance becomes Paid | — | Requested | issue job enqueued |
| SM-FIN-03 | InsurancePolicy | Requested | insurer returns policy number | — | Issued | policy number stored and sent |
| SM-FIN-03 | InsurancePolicy | Requested | retries exhausted | — | Failed | finance alerted; premium refund requested (RET-005 trigger) |
| SM-FIN-03 | InsurancePolicy | Issued | order cancelled or refunded before dispatch | — | Cancelled | IC-FIN-02 CancelPolicy |
| SM-FIN-04 | InsuranceClaim | (none) | policy holder submits claim | policy Issued; evidence attached | Submitted | sent to insurer |
| SM-FIN-04 | InsuranceClaim | Submitted | insurer status | callback verified | UnderReview | — |
| SM-FIN-04 | InsuranceClaim | UnderReview | insurer decision | callback verified | Approved / Rejected | holder notified |
| SM-FIN-04 | InsuranceClaim | Approved | insurer reports payment | callback verified | Settled | holder notified |
| SM-FIN-05 | PartnerFulfilment | (none) | order line of an Integrated service becomes Paid | — | Pending | fulfilment job enqueued |
| SM-FIN-05 | PartnerFulfilment | Pending | partner confirms | — | Fulfilled | receipt reference stored; order note |
| SM-FIN-05 | PartnerFulfilment | Pending | retries exhausted | — | Failed | finance alerted; refund requested (RET-005 trigger) |
| SM-FIN-07 | RepaymentInstruction | (none) | lender sends instruction | referral Disbursed | Active | — |
| SM-FIN-07 | RepaymentInstruction | Active | finance staff suspend with reason | FinancialServices.Repayments.CreateEditDelete | Suspended | AUD-FIN-002 |
| SM-FIN-07 | RepaymentInstruction | Suspended | finance staff resume with reason | FinancialServices.Repayments.CreateEditDelete | Active | AUD-FIN-002 |
| SM-FIN-07 | RepaymentInstruction | Active / Suspended | loan Closed or balance zero | — | Ended | no further deductions |


## 9. Data model (Proposed design — to be approved)

New entities are plugin tables (FluentMigrator migrations in the product assembly); native entities are not altered unless the L1 §6.3 register says so.

| Entity | Fields | Features | Relation to native nopCommerce |
|---|---|---|---|
| FinancePartner / PartnerProduct (new) | Partner: Id, Name, Type (Lender / Insurer / ServiceProvider / Registry), AdapterSystemName, CredentialsRef (encrypted), Status; Product: PartnerId, Name, Audience (Sellers / Buyers), DataCategories, CategoryIds, Description, IsActive | FIN-001 to FIN-003, FIN-005 | No native equivalent |
| Partner data-sharing consent (IAM PolicyAcceptance) | No FIN table: the consent (partner, purpose, data categories, decision accepted or withdrawn) is an IAM PolicyAcceptance row written through IC-IAM-05; FIN keeps the acceptance id on FinanceReferral and InvoiceFinancing | FIN-001 to FIN-003 | Consent text from the country profile (SEC-012); native GdprConsent is not reused because it is not per partner (Proposed) |
| FinanceReferral (new) | Id, CustomerId, VendorId, PartnerProductId, ConsentId, PartnerReference, Status (SM-FIN-01), StatusHistory | FIN-001 | |
| RepaymentInstruction / RepaymentDeduction (new) | Instruction: ReferralId, VendorId, Basis (Fixed / Share), Value, OutstandingBalance, Status (SM-FIN-07); Deduction: InstructionId, SettlementId, Amount, ReportedOnUtc | FIN-001 | Settlement entity owned by SEL-017 |
| InvoiceFinancing (new) | Id, ReceivableId, PartnerId, ConsentId, AdvanceAmount, DiscountAmount, RemitTo, Status (SM-FIN-02), PartnerReference | FIN-002 | Receivable owned by PAY-033 |
| InsurancePolicy / InsuranceClaim (new) | Policy: OrderId or OrderItemId, PartnerProductId, Premium, PolicyNumber, Status (SM-FIN-03); Claim: PolicyId, Description, EvidenceDownloadIds, Status (SM-FIN-04), ApprovedAmount, PartnerReference | FIN-003 | Evidence stored as native Download records; transit premium through native CheckoutAttribute |
| SubsidyScheme / SubsidyLedgerEntry (new) | Scheme: DiscountId, CustomerRoleId, Budget, Consumed, RegistryAdapter, EligibilityDays; Entry: SchemeId, OrderItemId, Amount, Type (Grant / Reversal) | FIN-004 | Discount and requirement are native (Discount, DiscountRequirement); the FIN rule is an IDiscountRequirementRule plugin |
| PartnerServiceConfig / PartnerFulfilment (new) | Config: ProductId, PartnerId, Mode (Information / HandOff / Integrated), HandOffUrl, AccountAttributeId; Fulfilment: OrderItemId, Status (SM-FIN-05), Attempts, ReceiptReference, LastError | FIN-005 | Products, attributes, Published and StoreMapping are native |


## 10. Configuration

### 10.1 Configuration-pack rows owned by this module (from the workbook "Config pack schema")

| Artefact | nopCommerce 5.00 source | Layers | Owning PRD | Pack |
|---|---|---|---|---|
| Agri-finance and schemes pack settings | Scheme definitions, eligibility rules, budgets, partner credit/insurance products, disbursement rails | vertical (Schemes pack) → client | ORD-024 / PAY-022 / FIN-001 – FIN-004 | Agri-finance and schemes pack |

### 10.2 Settings and client values

| Setting | Where it lives | Layer | KTDA (source) | Malawi Post (source) |
|---|---|---|---|---|
| Partners, partner products, data categories | FinancePartner / PartnerProduct (new) | client | Not stated | Not stated (Table 8, T-MISS) |
| Partner credentials | FIN adapter settings, encrypted (new); flagged secret in the key catalogue (BR-FIN-010, BR-PLT-013) | client instance only | Entered at deployment | Entered at deployment |
| Consent text per purpose | Country law profile (SEC-012) | country | Not stated | Not stated |
| Connector timeouts and retry counts | FinancialServicesSettings (new): financialservicessettings.connectortimeoutseconds, financialservicessettings.connectorretrycount (key names Proposed; FIN key catalogue, BR-FIN-012) | client | Not stated | Not stated |
| Feature state per client and store | productfeature.<prd-id> for PRD-FIN-001 to PRD-FIN-005 (PLT-022, IC-PLT-02) | client → store | Not stated | Not stated |
| Transit insurance option and premium rule | CheckoutAttribute (native) + FIN settings | client → store | Not stated | Not stated |
| Subsidy schemes, roles, budgets, eligibility expiry | Discount (native) + SubsidyScheme (new) | vertical (Schemes pack) → client | Not stated | Not stated |
| Partner services: category, fulfilment mode, store mapping | Product, Category, StoreMapping (native) + PartnerServiceConfig (new) | client → store | — | Not stated (Table 8, T-MISS) |

Runtime settings resolve at two levels only (store value, else shared value); global, country, vertical, client and store layers are merged by the pack loader at apply time in that order (BR-PLT-010; L1 §6.5).


## 11. Screens, user interface and messages

### 11.1 Screens

| Area | Screen | Features | Native or new |
|---|---|---|---|
| Seller portal | Finance offers, consent and referrals; repayment deductions; invoice discounting | FIN-001, FIN-002 | New |
| Storefront | Credit offer link on product pages; transit insurance option at confirm step | FIN-001, FIN-003 | Native product page and checkout attribute extended |
| Storefront — My account | Consents (withdraw); referrals; insurance policies and claims | FIN-001, FIN-003 | New tabs |
| Storefront | Partner services category with information, hand-off and integrated modes | FIN-005 | Native catalog pages |
| Admin | Partners and partner products; consent records; referrals; invoice financing; policies and claims; partner fulfilments | FIN-001 to FIN-003, FIN-005 | New |
| Admin | Subsidy schemes and claim report | FIN-004 | New; discount edit is native |

Screen layouts are not specified here. They follow the approved designs (to be produced) and the client theme (PLT-006); until approved, developers build no layout of their own beyond the native nopCommerce admin and DefaultClean storefront patterns.


### 11.2 User-facing messages (locale resource keys)

| Key | Default English text (Proposed) | Used by |
|---|---|---|
| Fin.ConsentRequired | We cannot send your application without your agreement to share the listed data. | AC-FIN-001-03-02 |
| Fin.SubsidyBudgetExhausted | The subsidy for this item is no longer available. | AC-FIN-004-02-02, AC-FIN-004-02-03 |
| Fin.NotEligible | We could not confirm that you are eligible for this scheme. | AC-FIN-004-03-01 |
| Fin.AccountInvalid | The account or reference number was not accepted by the provider. Please check it and try again. | AC-FIN-005-03-01 |

Default English text is Proposed. Every key is a locale resource (Definition of Done criterion 8); client language packs translate it.


## 12. Integrations, contracts, events and concurrency

### 12.1 External interfaces

| Interface | Operations | Counterpart | Note |
|---|---|---|---|
| Partner lenders (FIN-001, FIN-002) | SubmitApplication, WithdrawConsent, StatusCallback, ReportRepayment, ShareInvoice (IC-FIN-01) | Not named | External system; fit: Not implementable in nopCommerce |
| Partner insurers (FIN-003) | IssuePolicy, CancelPolicy, SubmitClaim, ClaimStatus (IC-FIN-02) | Not named | External system |
| Partner service providers (FIN-005) | ValidateAccount, Fulfil (IC-FIN-03) | Not named (Table 8, T-MISS) | External system |
| Programme registry (FIN-004) | CheckEligibility (IC-FIN-04) | Not named | External system |
| Consent records (FIN-001 to FIN-003) | IC-IAM-05 RecordAcceptance, GetActiveConsent | IAM-016 (internal) | Decision ONE-RECORD |
| Seller settlements (FIN-001) | IC-SEL-05 AddSellerCharge (RepaymentDeduction); IC-SEL-07 Seller.SettlementPaid | SEL-017 (internal) | FIN supplies the deduction; SEL-017 owns the settlement |
| Receivables (FIN-002) | IC-PAY-08 GetOpenReceivables (by payee), LockForOffer, Assign, ReleaseLock, AllocateExternal | PAY-033 (internal) | PAY owns the receivable state (SM-PAY-09) and payee |
| Subsidy budget at placement (FIN-004) | Placement participant IC-CHK-06 (Reserve / Confirm / Release) | CHK-003 IOrderProcessingService owner (internal, OVR-REG) | |
| Notifications (all features) | IC-TRK-04 RegisterEventCode, SendEvent | TRK-005 (internal) | Decision MSG-ROUTE; TRK-006 opt-outs apply |
| Refund triggers (FIN-003, FIN-005) | RaiseRefundTrigger (IC-RET-04), source types PolicyIssueFailed, PartnerFulfilmentFailed | RET-005 (internal) | RET-005 sends the refund to PAY-016 |
| Audit trail (all features) | IAuditTrail.WriteAsync (IC-SEC-01) | SEC-004 (internal) | |

### 12.2 Interface contracts

| Contract | Operation | Inputs | Outputs | Errors | nopCommerce mapping |
|---|---|---|---|---|---|
| IC-FIN-01 | SubmitApplication | Partner, loan product, consented data set, consent reference, customer reference | Partner application reference | Partner unavailable; validation error | FIN lender connector interface (new); called from the FIN service, not from an event consumer |
| IC-FIN-01 | WithdrawConsent | Consent reference | Acknowledged | Partner unavailable (retried by task) | FIN lender connector |
| IC-FIN-01 | StatusCallback | Partner payload on the FIN callback route | Verified status mapped to SM-FIN-01 / SM-FIN-02; repayment instruction | Signature invalid (rejected, AUD-FIN-005) | Plugin controller deriving from Microsoft.AspNetCore.Mvc.Controller on its own route (IRouteProvider), no antiforgery attribute (pattern: PayPalCommerceWebhookController) |
| IC-FIN-01 | ReportRepayment | Loan reference, settlement reference, amount | Acknowledged | Partner unavailable (retried) | FIN lender connector; called by a FIN task enqueued by the consumer of Seller.SettlementPaid (SEL-017) |
| IC-FIN-01 | ShareInvoice | Invoice data, invoice PDF, buyer and seller references, consent reference | Partner request reference | Partner unavailable | FIN lender connector; PDF from IPdfService (owner DOC-001 under OVR-REG; ORD-009 supplies the layout) |
| IC-FIN-02 | IssuePolicy / CancelPolicy | Order reference, insured value, goods category, route | Policy number; cancellation result | Partner unavailable; declined | FIN insurer connector; IssuePolicy runs in an IScheduleTask job |
| IC-FIN-02 | SubmitClaim / ClaimStatus | Policy number, description, evidence files | Claim reference; status | Partner unavailable | FIN insurer connector; status by callback route |
| IC-FIN-03 | ValidateAccount / Fulfil | Service, account reference, amount, order reference | Valid or invalid; receipt reference | Invalid reference; partner unavailable | FIN partner-service connector; Fulfil runs in an IScheduleTask job |
| IC-FIN-04 | CheckEligibility | Scheme, customer identifiers required by the registry | Eligible / Not eligible, expiry date | Registry unavailable | FIN registry connector (registry not named) |

Each connector is an interface defined by the FIN plugin; partner adapters implement it and declare which operations they support. Operation signatures (C# interface) are produced at L2 build start and approved by the tech lead. Timeouts and retry counts are settings with defaults not stated. No FIN connector implements IPaymentMethod: none appears at checkout.

### 12.3 Events

| Module event | Native nopCommerce event / mechanism | Consumers / effect |
|---|---|---|
| Order paid with insurance or an integrated partner service | OrderPaidEvent (native) | FIN consumer enqueues the issue or fulfilment job; the scheduled task does the work |
| Refund completed | OrderRefundedEvent (native) | FIN consumer enqueues policy cancellation and subsidy budget reversal jobs |
| Order cancelled | OrderStatusChangedEvent (native) | FIN consumer enqueues the subsidy budget reversal job (BR-FIN-007) |
| Subsidy reserved at placement | IC-CHK-06 placement participant (CHK-003 PlaceOrderAsync override) | Reserve, Confirm, Release of the scheme budget (BR-FIN-007) |
| Settlement paid (SEL-017) | Seller.SettlementPaid (SEL plugin event IC-SEL-07) | FIN consumer only enqueues the ReportRepayment job; the task reports the repayment to the lender |
| Partner status received | None (FIN callback route) | Referral, financing, policy and claim records updated; customer notified (TRK-005, IC-TRK-04) |

Event consumers in nopCommerce swallow exceptions (L1 §6.2 principle 8): money-moving logic runs in services, not in consumers; consumers only notify or enqueue jobs.

### 12.4 Concurrency and timing cases

| Case | Features | Required behaviour |
|---|---|---|
| Two carts consume the last subsidy budget at once | FIN-004 | The FIN placement participant (IC-CHK-06) reserves the budget under ILocker key 'fin-scheme-{SchemeId}'; the second Reserve is refused (Fin.SubsidyBudgetExhausted) and that placement is refused; after the cart is recalculated the buyer can order at full price |
| Duplicate partner callback | FIN-001 to FIN-003 | Callbacks are de-duplicated by partner reference and current status; a repeated status is logged and ignored |
| Fulfilment job and refund at the same time | FIN-005 | Both run under ILocker key 'fin-fulfil-{OrderItemId}'; a Fulfilled line is not refunded automatically; a refunded line is not sent for fulfilment |
| Seller offers the same invoice twice | FIN-002 | IC-PAY-08 LockForOffer saves Offered under the Receivable row version (SM-PAY-09); the second offer is refused and no second InvoiceFinancing record is created (BR-FIN-004) |


## 13. Notifications

| Trigger | Recipient | Channel | Feature |
|---|---|---|---|
| Referral status change | Seller or buyer | Email + SMS (TRK-005, IC-TRK-04; BR-FIN-013) | FIN-001 |
| Repayment deducted | Seller | Seller statement (SEL-017) + email | FIN-001 |
| Invoice financed or declined | Seller; buyer when financed | Email | FIN-002 |
| Policy issued / failed | Buyer; finance staff on failure | Email / admin notification | FIN-003 |
| Claim status change | Policy holder | Email + SMS | FIN-003 |
| Partner fulfilment completed / failed | Customer; finance staff on failure | Email + SMS / admin notification | FIN-005 |


## 14. Reports and audit

### 14.1 Reports

| Report | Feature | Basis |
|---|---|---|
| Referrals by partner and status | FIN-001 | D |
| Repayment deductions by loan and settlement | FIN-001 | FC-M14-005 |
| Invoice financing register | FIN-002 | D |
| Policies and claims | FIN-003 | FC-M14-009 |
| Subsidy claim report per scheme | FIN-004 | D |
| Partner service fulfilments | FIN-005 | D |

### 14.2 Audit event catalogue

| ID | Event | Actor | Entity | Fields recorded |
|---|---|---|---|---|
| AUD-FIN-001 | Consent given or withdrawn (recorded by IAM, AUD-IAM-012); data sent to a partner | Customer / system | IAM PolicyAcceptance (id), FinanceReferral | partner, categories, purpose, time |
| AUD-FIN-002 | Repayment instruction suspended, resumed or corrected | Finance staff | RepaymentInstruction | old and new status, reason |
| AUD-FIN-003 | Invoice assigned to a lender | System | InvoiceFinancing, Receivable | lender, advance amount, receivable |
| AUD-FIN-004 | Subsidy scheme created or changed | Programme staff | SubsidyScheme, Discount | old values, new values |
| AUD-FIN-005 | Partner callback rejected | System | Connector | payload hash, source, reason |

Business audit events AUD-FIN-nnn are written through IC-SEC-01 IAuditTrail.WriteAsync with the request correlation id (BR-SEC-014); old and new entity values are captured by the SEC IRepository<> decorator and need no call. All FIN tables are written through IRepository<>; FIN writes nothing through INopDataProvider directly (BR-SEC-010, BR-SEC-011). The native activity log is not used as the audit record. Names and fields are Proposed.


## 15. Non-functional requirements

| ID | Requirement | Basis | Verified by |
|---|---|---|---|
| NFR-FIN-001 | Customer data reaches a partner only under a recorded consent and only for the consented categories. | D; NFR-X-002; BR-FIN-002 | AC-FIN-001-03-03, 001-03-04; T-FIN-02 |
| NFR-FIN-002 | Every partner callback is authenticated before it changes a record. | Proposed | AC-FIN-001-06-01; AUD-FIN-005 |
| NFR-FIN-003 | Partner credentials are encrypted and never in configuration packs. | CFG-01; NFR-X-001 | AC-FIN-001-04-01 |
| NFR-FIN-004 | Response-time and availability targets for partner calls: Not stated in source — requires confirmation. | NFR-X-009 | — (no target) |

Cross-cutting NFR-X-001 to NFR-X-009 (L1 §8.3) also apply.


## 16. Dependencies, phase and build order

| PRD ID | Phase | Depends on | Needed by |
|---|---|---|---|
| PRD-FIN-001 | P3 | — | |
| PRD-FIN-002 | P3 | — | |
| PRD-FIN-003 | P3 | — | |
| PRD-FIN-004 | P3 | — | |
| PRD-FIN-005 | P1 | — | |

Build order inside the module follows dependencies: the connector frameworks first, then adapters, then features that consume them. The Product Owner orders the Product Backlog; this list is not an order.


## 17. Test notes

| ID | Test note |
|---|---|
| T-FIN-01 | Each partner connector is tested against the partner sandbox where one exists: success, failure, timeout, duplicate callback. |
| T-FIN-02 | Consent: no data leaves the platform without consent; withdrawn consent stops further sharing; only consented categories are sent. |
| T-FIN-03 | Repayment caps: deductions never exceed instruction, balance or settlement (BR-FIN-003). |
| T-FIN-04 | Subsidy budget under concurrent orders: total granted never exceeds the budget (BR-FIN-007). |
| T-FIN-05 | State models: every transition in §8.2 is tested; every transition not listed is rejected. |
| T-FIN-06 | Permissions: each permission in §4 has an allow and a deny case (§4.1). |
