# Working role groups

The product mapping diagram groups the product's users into four clusters and fifteen groups, and
counts, for each, **the features whose "Who uses it" list names that group**. Its own footnote is
explicit: *"Working grouping for reading; not defined in client sources."* So this file is the
grouping, not a requirement: it is here so the prototype can show the same numbers and so the
roll-up can be corrected in one place.

The counts **overlap on purpose** — a feature names several users, so it appears in several groups.
They do not sum to 434.

## How a group is counted

A feature belongs to a group when its Client-PRD section 7 "Who uses it" list contains any of the
role names in the last column (case-insensitive, exact match on a semicolon-separated entry).
`scripts/generate-registries.mjs` computes each group and compares it with the diagram count;
`scripts/check-consistency.mjs` reports a difference as a warning, never a failure, because the
grouping is not a client source.

| Cluster | Group | Diagram count | Confirmed | Role names in the "Who uses it" list |
|---|---|---|---|---|
| Buyers and citizens | Shoppers | 213 | no | shoppers; buyers; customers; registered customers; guest shoppers; visitors; all users; new users; shoppers in low-connectivity areas; shoppers on basic phones; shoppers with low-end phones; international shoppers; shoppers with disabilities; shoppers and staff with disabilities; kenyan shoppers; malawian shoppers; ktda shoppers; malawi post shoppers; ktda customers; malawi post customers; affected customers; clients' customers; parcel recipients; members of the public; the public; farmers |
| Buyers and citizens | Business buyers | 45 | no | business buyers; international buyers; eligible buyers; company administrators; company approvers; procurement staff; requesters |
| Buyers and citizens | Walk-in customers | 4 | yes | walk-in customers |
| Buyers and citizens | Citizens and beneficiaries | 11 | no | citizens; beneficiaries; applicants; applicants (buyers, sellers, citizens); policy holders; programme funders; funders |
| Sellers and partners | Sellers | 74 | yes | sellers; seller staff; small businesses; suppliers |
| Sellers and partners | Service providers and partners | 21 | no | service providers; partners; affiliates; partner developers; partner system developers; mobile app developers; integrators; channel systems |
| Oversight and government | Auditors, compliance, security and privacy | 49 | no | auditors; compliance staff; compliance officers; privacy officers; security officers; security team; security and fraud staff; fraud and compliance staff; regulators; tax authorities; certification bodies |
| Oversight and government | Government agencies | 9 | no | government agencies; government agencies and their systems; agency administrators; agency officers; e-government service administrators; government and malawi post system operators |
| Client staff | Client administrators | 137 | yes | client administrators; client it administrators; client management; client managers |
| Client staff | Catalogue and content staff | 30 | no | catalogue staff; catalogue managers; catalogue and marketing staff; content staff; content managers; content approvers; document authors; translators; template designers; template approvers; forum moderators |
| Client staff | Marketing and sales staff | 37 | no | marketing staff; sales staff; client sales staff; ktda sales staff; legal and sales staff; sales and logistics staff |
| Client staff | Finance, fraud and legal staff | 80 | no | finance staff; ktda finance staff; malawi post finance staff; finance and legal staff; fraud staff; fraud and security staff; legal staff; content and legal staff; cashiers |
| Client staff | Logistics, warehouse and operations staff | 74 | no | logistics staff; ktda logistics staff; logistics managers; warehouse staff; warehouse and outlet staff; stock staff; stock planners; operations staff; operations managers; client operations staff; client order staff; malawi post operations staff; malawi post outlet and operations staff; malawi post staff at collection points, hubs and on delivery rounds; couriers; malawi post couriers; quality staff; export staff; ktda export staff; operators; operators working away from a desk; branch, factory and regional staff |
| Client staff | Support staff | 28 | no | support staff; support agents; support managers; client support staff; account managers |
| Client staff | Outlet agents | 15 | yes | outlet staff; outlet agents; agents; post-office staff |
| Client staff | Management and analysts | 64 | no | management; managers; analysts; ktda analysts; ktda analytics users; ktda managers; malawi post managers; staff; administrators; authorised administrators; user administrators; ktda administrators; malawi post administrators; ktda staff; ktda; malawi post; client staff; client staff (finance, sales, export); client staff who review documents; clients; new clients; all clients; programme staff; stakeholders; reviewers |
| Client staff | Platform and IT team | 31 | no | platform team; it; it team; it teams; client it teams; it teams of connected systems; integration managers |

## Status

"Confirmed" means the role names above reproduce the diagram count exactly from the registry.
Five groups are confirmed: **Client administrators (137)**, **Sellers (74)**, **Outlet agents (15)**,
**Platform and IT team (31)** and **Walk-in customers (4)**. The rest are a first assignment of the 169 distinct role names that
appear in the "Who uses it" lists; their role-name lists need a line of confirmation before the
counts can be relied on. Correcting a list here changes the registry, the prototype and the build
order together.
