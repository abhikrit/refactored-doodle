# L2 Module PRD — IAM: Identity, access and accounts

<!-- Single source. The Word file is generated from this Markdown by tools/md2docx.py. -->

## 1. Document control

| Item | Value |
|---|---|
| Module | IAM — Identity, access and accounts |
| Version | 1.0 |
| Status | Draft. Not approved. |

**How to read the labels.** Every story, rule and criterion names its basis: **D** = the feature description; **REQ-…** = a client requirement delivered by that feature; **FC-…** = a catalog feature; **FIT** = verified nopCommerce 5.00.1 behaviour; a decision ID. "see XXX-nnn (REQ-…)" points to a requirement delivered by another feature. **Proposed** = a product design choice that needs Product Owner approval. "Not stated in source — requires confirmation" marks a value the product does not fix; developers do not fill it. Gap IDs: KG-nn = KTDA, MG-nn = Malawi Post.

## 2. Purpose and scope

Lets shoppers, business buyers, sellers, outlet agents and client staff create and use accounts (by email or by mobile number), protects those accounts (password policy, lockout, multi-factor authentication, session control, suspicious-login detection), decides what each person may see and do (roles, product roles shared with other modules, scoped permissions, delegation), gives customers control of their profile, addresses, preferences, consents and privacy rights, records terms acceptance by version, supports B2B company accounts and trade approval, assisted service by named agents at outlets, and connects accounts to external identity providers, identity registries and the client core systems through adapters.

**In scope**

- Registration and login by email (native) and by mobile number with SMS one-time code; password policy, lockout and recovery; extra recovery checks for sensitive roles (IAM-001 to IAM-003)
- Multi-factor authentication enforced by role and opt-in for buyers; single sign-on and join/leave provisioning (P2); passwordless login (P2) (IAM-004, IAM-005, IAM-013)
- Session control: idle timeout, concurrent-session limit, forced logout (IAM-006)
- Roles and permissions on the 5.00 permission model, including the product role catalogue used by all modules; scoped permissions; delegation (P2) (IAM-007 to IAM-009)
- User administration console, self-deactivation and reactivation, staff invitation, access reviews and the access audit report (IAM-010, IAM-011)
- Authentication event log and suspicious-login detection (IAM-012)
- Customer profile, address book, pickup and channel preferences, terms acceptance by version, privacy rights flows, account activity history, transaction history (IAM-014 to IAM-018, IAM-021)
- Account synchronisation with client core systems and the identity verification adapter framework (IAM-019, IAM-020)
- B2B company accounts, trade-account application and approval, tax-exempt and VAT-registered buyers, cost centres and budgets (P2) (IAM-022 to IAM-024, IAM-027)
- Customer home dashboard (P2) and assisted service by named outlet agents (IAM-025, IAM-026)

**Not in this module**

| Item | Where it is |
|---|---|
| SMS gateway that sends the one-time codes | CHN module (PRD-CHN-005); IAM-002 calls it through IC-IAM-01 |
| Notification channels and per-event notification preferences | TRK module (PRD-TRK-005, TRK-006); IAM-015 stores the default preferred channel |
| Policy content and policy version approval | MKT module (PRD-MKT-008, held by WF-ENG); IAM-016 records acceptance per version |
| Cookie categories, consent banner and native GDPR settings | SEC module (PRD-SEC-007); IAM-017 owns the customer-facing rights flows |
| Country data-protection deadlines (data-request response time, breach deadlines) | SEC module (PRD-SEC-012) |
| Platform audit trail store (before/after values, hash chain) | SEC module (PRD-SEC-004); IAM writes AUD-IAM events to it |
| Assisted checkout screens and the assisted-order record (order linked to agent and outlet) | CHK module (PRD-CHK-013, AssistedOrder); IAM-026 provides the agent identity, outlet and the acting-session checks (customers of the agent's own outlet, BR-IAM-130) |
| Block, watch and allow lists checked at registration and login | SEL module (PRD-SEL-013, Platform core filter); BR-IAM-003 |
| Per-company assortments and their customer roles | CAT module (PRD-CAT-040); IAM-022 supplies company membership (IC-IAM-07) |
| Purchase approval thresholds per company role; approval queues | CHK module (PRD-CHK-018); ADM module (PRD-ADM-006) reads authority and delegations through IC-IAM-06 |
| Outlet and pickup-point master data | LOG module (PRD-LOG-003) |
| B2B order approvals, on-account payment and credit limits | CHK module (PRD-CHK-016, CHK-018) |
| Seller registration and seller identity checks | SEL module (PRD-SEL-001, SEL-004); identity checks use the IAM-020 adapter framework |
| Integration layer (API gateway) used for account synchronisation | INT module (PRD-INT-002, INT-004 retries) |
| Tax rates and tax calculation | PAY module (PRD-PAY-020); IAM-024 supplies exemption flags and VAT numbers |
| Identity registries, mobile-network KYC services and identity providers themselves | External systems (not named in source) |

## 3. Feature summary

| PRD ID | Feature | Channel | Phase | Implementation | Code change | Pack | Depends on | Held by |
|---|---|---|---|---|---|---|---|---|
| PRD-IAM-001 | Customer registration and login | B2B + B2C | P1 | Configuration | None | Core (always on) | | |
| PRD-IAM-002 | Mobile-number identity with OTP | B2B + B2C | P1 | Code-level | Custom plugin (ISmsProvider + DI override) + Theme/view override | Core (always on) | PRD-CHN-005 | |
| PRD-IAM-003 | Password policy, lockout and recovery | B2B + B2C | P1 | Code-level | Custom plugin | Core (always on) | | |
| PRD-IAM-004 | Multi-factor authentication by role | B2B + B2C | P1 | Code-level | Custom plugin | Core (always on) | | |
| PRD-IAM-005 | Single sign-on for staff and B2B buyers | B2B + B2C | P2 | Code-level | Custom plugin | Core (always on) | | |
| PRD-IAM-006 | Session management | B2B + B2C | P1 | Code-level | Custom plugin | Core (always on) | | |
| PRD-IAM-007 | Roles and permissions | B2B + B2C | P1 | Configuration | None | Core (always on) | | |
| PRD-IAM-008 | Scoped permissions | B2B + B2C | P1 | Code-level | Custom plugin + Core modification | Core (always on) | | |
| PRD-IAM-009 | Permission delegation | B2B + B2C | P2 | Code-level | Custom plugin | Access and admin extensions pack | | |
| PRD-IAM-010 | User administration console | Platform / back-office | P1 | Code-level | Custom plugin | Core (always on) | | |
| PRD-IAM-011 | Staff invitation and access reviews | Platform / back-office | P1 | Code-level | Custom plugin | Core (always on) | | |
| PRD-IAM-012 | Authentication audit and suspicious-login detection | Platform / back-office | P1 | Code-level | Custom plugin | Core (always on) | PRD-SEC-004 | |
| PRD-IAM-013 | Passwordless and biometric login | B2B + B2C | P2 | Code-level | Custom plugin | Access and admin extensions pack | | |
| PRD-IAM-014 | Customer profile and address book | B2B + B2C | P1 | Code-level | Theme/view override + Custom plugin | Core (always on) | | |
| PRD-IAM-015 | Pickup preference and preferred channel | B2B + B2C | P1 | Code-level | Custom plugin | Postal and logistics pack | | |
| PRD-IAM-016 | Terms acceptance with versioning | B2B + B2C | P1 | Code-level | Custom plugin | Core (always on) | | |
| PRD-IAM-017 | Privacy rights | B2B + B2C | P1 | Code-level | Custom plugin | Core (always on) | PRD-SEC-012 | |
| PRD-IAM-018 | Account activity history | B2B + B2C | P1 | Code-level | Custom plugin | Core (always on) | | |
| PRD-IAM-019 | Account synchronisation with core systems | B2B + B2C | P1 | Code-level | External system + integration plugin | Client: MPC | | |
| PRD-IAM-020 | Identity verification adapter framework | B2B + B2C | P1 | External system | External system + integration plugin | Core (always on) | | |
| PRD-IAM-021 | Customer transaction history | B2B + B2C | P1 | Code-level | Custom plugin + Theme/view override | Core (always on) | | |
| PRD-IAM-022 | B2B company accounts | B2B | P1 | Code-level | Custom plugin + Theme/view override | B2B trade pack | | PH-INF |
| PRD-IAM-023 | B2B buyer registration and approval | B2B | P1 | Code-level | Custom plugin + Theme/view override | B2B trade pack | | PH-INF |
| PRD-IAM-024 | Tax-exempt and VAT-registered buyers | B2B | P1 | Configuration | None | B2B trade pack | | |
| PRD-IAM-025 | Customer home dashboard | B2B + B2C | P2 | Code-level | Custom plugin + Theme/view override | Core (always on) | | |
| PRD-IAM-026 | Assisted service by agents | B2B + B2C | P1 | Code-level | Custom plugin | Assisted service pack | | |
| PRD-IAM-027 | Company cost centres and budgets | B2B | P2 | Code-level | Custom plugin | B2B trade pack | PRD-IAM-022 | PH-INF |

## 4. Actors and permissions

| Actor | What they do in this module | Role in nopCommerce |
|---|---|---|
| Shopper (guest or registered) | Registers by email or mobile number, logs in, manages profile, addresses, preferences, consents and privacy requests, sees activity and order history | Guests / Registered (native) |
| Business buyer (company member) | Applies for a trade account, buys for a company with a company role (buyer, approver, company administrator) | Registered + TradeBuyer (Proposed; IAM-023) + company role in the company record (IAM-022) |
| Seller user | Logs in to the seller portal; password, MFA and session rules apply as for staff | Vendors (native) |
| Client administrator | Configures registration, password, MFA and session policy; manages roles, permissions, scopes, invitations, access reviews | Administrators (native) |
| User administrator | Finds users, views details, activates and deactivates accounts; members of Administrators also act as the customer with a record kept (IAM-010; the impersonation filter allows no other user administrator, BR-IAM-130) | Administrators, or a client role holding native Customers.* permissions (role name not stated in source, KG-16, MG-08) |
| Account manager | Acts for assigned business customers through the native impersonation action (CRM-015 rule provider to the IAM impersonation filter, BR-IAM-130) | Role system name "AccountManager" (Proposed by CRM; BR-IAM-050) |
| Support staff | Sees customer details only through the CRM-003 360-degree view and the consent trail (IAM-016); does not use the native admin customer page | Role system names "Support", "SupportManager" (Proposed by CRM; BR-IAM-050); never hold native Customers.CustomersView (BR-CRM-030, BR-IAM-054) |
| Outlet agent | Logs in with a named account, registers walk-in customers and acts for them at an outlet | Role system name "Agent" (Proposed; BR-IAM-050; used by PAY-034, CHK-013, CHN, CRM, EGV, LOG, RET, SVC, TRK) |
| Staff of other modules | Not IAM users of their own; their roles are part of the IAM-007 role catalogue (for example finance, fraud, compliance, warehouse, marketing staff) | Role system names in BR-IAM-050 (Proposed by the owning modules) |
| Security officer | Reviews authentication events and suspicious-login flags, ends sessions | Role system name "SecurityOfficer" (Proposed) |
| Privacy officer | Handles correction and deletion requests within the country deadlines | Role system name "PrivacyOfficer" (Proposed; also SEC-008, SEC-012) |
| Auditor | Reads access reports and authentication events | Role system name "Auditor" (Proposed; time-boxed by SEC-010) |
| Approver / manager | Delegates approval rights (P2), confirms access in reviews | Any role that holds a delegable permission |
| Identity provider (system) | Authenticates staff and business buyers, sends join/leave events (P2) | External system, not named in source |
| Client core systems (system) | Exchange customer account data with the platform (Malawi Post) | External systems through the Integration Layer (PRD-INT-002); not named (MG-09) |
| Identity registry or mobile-network KYC service (system) | Confirms identity details | External systems, not named in source |
| SMS gateway (system) | Delivers one-time codes | PRD-CHN-005 |

| Permission (system name) | Category | Allows | Default roles |
|---|---|---|---|
| Customers.CustomersView (native) | Customers | Search and view customers in the user administration console (IAM-010) | Administrators |
| Customers.CustomersCreateEditDelete (native) | Customers | Create and edit customers, activate and deactivate, assign roles, remove an MFA binding (IAM-007, IAM-010) | Administrators |
| Customers.CustomersImpersonation (native) | Customers | Act as a customer from the admin console (IAM-010); start an acting session at an outlet (IAM-026, CHK-013) or for an assigned business customer (CRM-015); every request also passes the single IAM impersonation filter (BR-IAM-130) | Administrators (native default); Agent, AccountManager (role pack mapping, BR-IAM-053; CHK-013, CRM-015) |
| Customers.CustomerRolesView (native) | Customers | View customer roles (IAM-007) | Administrators |
| Customers.CustomerRolesCreateEditDelete (native) | Customers | Create, edit and delete customer roles; the native role Create, Edit and Delete POST actions also require Configuration.ManageACL (IAM-007) | Administrators |
| Configuration.ManageACL (native) | Configuration | Change the permission-to-role mappings (native SecurityController.PermissionEditPopup) and restrict products, categories, manufacturers, topics and menus to roles (IAM-007) | Administrators |
| Customers.GDPRManage (native) | Customers | GDPR log, staff-initiated export and deletion; with IAM installed also the correction-request queue (IAM-017) | Administrators; PrivacyOfficer (Proposed) |
| Configuration.ManageMultifactorAuthenticationMethods (native) | Configuration | Activate and configure MFA providers (IAM-004) | Administrators |
| Security.EnableMultiFactorAuthentication (native) | Security | Use multi-factor authentication on the own account (IAM-004) | Administrators, Registered (native defaults) |
| Configuration.ManageExternalAuthenticationMethods (native) | Configuration | Activate and configure single sign-on providers (IAM-005) | Administrators |
| Identity.Core.Sessions.View | Customers | View the active sessions of a user (IAM-006) | Administrators, SecurityOfficer |
| Identity.Core.Sessions.CreateEditDelete | Customers | End one session or force a user off the system (IAM-006) | Administrators, SecurityOfficer |
| Identity.Core.AccessGovernance.CreateEditDelete | Customers | Manage scoped permissions, staff invitations and access-review campaigns (IAM-008, IAM-011) | Administrators |
| Identity.Core.AccessReports.View | Reports | Run and export the access audit report (IAM-011) | Administrators, Auditor |
| Identity.Core.AuthEvents.View | Customers | View authentication events and suspicious-login flags (IAM-012) | Administrators, SecurityOfficer, Auditor |
| Identity.Core.ConsentTrail.View | Customers | View the consent and terms-acceptance trail of a customer (IAM-016, IAM-017; read by CRM-003 through IC-IAM-05) | Administrators, PrivacyOfficer, Support, SupportManager |
| Identity.Core.TradeAccounts.CreateEditDelete | Customers | Review trade-account applications and manage company accounts (IAM-022, IAM-023) | Administrators |
| Identity.Core.Agents.CreateEditDelete | Customers | Register outlet agents and assign them to outlets (IAM-026) | Administrators |
| Identity.Core.AssistedService.Access | PublicStore | Register walk-in customers at an outlet; marks the holder as an agent for the IAM acting-session checks (IAM-026, BR-IAM-130) | Agent |
| Identity.Core.Verification.CreateEditDelete | Customers | Configure identity verification adapters and decide inconclusive results (IAM-020) | Administrators |
| Identity.Core.Delegations.CreateEditDelete | Customers | Create or revoke a delegation between two other users (IAM-009); users delegate their own rights without this permission (BR-IAM-070) | Administrators |
| Configuration.ManageSmsSettings (native, 5.00) | Configuration | Install SMS provider plugins and mark the primary SMS provider used for one-time codes (IAM-002; StandardPermission.Configuration.MANAGE_SMS_SETTINGS) | Administrators |

Native permissions are reused where they exist (rows marked native). New permissions are declared in an IAM plugin class implementing IPermissionConfigManager (pattern: Misc.RFQ RfqPermissionConfigManager), with system names prefixed by the plugin system name (Proposed: Identity.Core) and the 5.00 view / create-edit-delete split (unchanged from 4.90); Category is taken from the native set (Customers, Reports, PublicStore, Configuration, Security). Default roles are given by role system name. PermissionService.InsertPermissionsAsync (called at application start by AppStartedConsumer) installs only permissions that do not exist yet, and only then creates a missing default role with that system name (IsSystemRole false). A role that holds only native permissions is therefore never created this way, and a deleted role is not re-created; the IAM plugin creates every missing role of the product role catalogue (BR-IAM-050) at install and at start. Other modules therefore never rely on native start-up to create a catalogue role; the IAM plugin is the only creator (owner decision Roles). Native permissions given to product roles (for example Customers.CustomersImpersonation to Agent and AccountManager, Orders.OrdersView to AgencyOfficer) are mapped by the role pack (BR-IAM-053); the account synchronisation queue of IAM-019 is the INT-004 message log (Integrations.Core.Messages.View, INT), so IAM declares no queue permission; native IPermissionService.InsertPermissionMappingAsync skips unknown names silently, so unknown names are caught by pack validation (IC-PLT-01 Validate, BR-IAM-052). In 5.00.1 permission-to-role mappings are edited in SecurityController.PermissionEditPopup, which requires Configuration.ManageACL (SecurityController.cs:104-115). News, polls and forums are bundled plugins in 5.00 (Misc.News, Misc.Polls, Misc.Forums) with their own permissions (News.View / News.Manage, Polls.View / Polls.Manage, Forums.View / Forums.Manage), which replace ContentManagement.News*, Polls* and Forums*; they exist only where the plugin is installed. Native ForceMultifactorAuthentication applies to every holder of Security.EnableMultiFactorAuthentication, which by default includes Registered; MFA by role is therefore enforced by the IAM filter (BR-IAM-030). All new names are Proposed. Source: Libraries/Nop.Services/Security/StandardPermission.cs, DefaultPermissionConfigManager.cs, PermissionService.cs (InsertPermissionsAsync, InstallPermissionsAsync, InsertPermissionMappingAsync); Presentation/Nop.Web/Areas/Admin/Controllers/SecurityController.cs, CustomerRoleController.cs; Presentation/Nop.Web.Framework/Infrastructure/AppStartedConsumer.cs.

### 4.1 Standard permission criteria

| ID | Criterion | Basis |
|---|---|---|
| AC-IAM-PERM-01 | **Given** a user without Customers.CustomersView (native), **when** they open or post any function it guards, **then** access is denied and nothing changes; **given** a user with it, the function is available. | Proposed (T-05) |
| AC-IAM-PERM-02 | **Given** a user without Customers.CustomersCreateEditDelete (native), **when** they open or post any function it guards, **then** access is denied and nothing changes; **given** a user with it, the function is available. | Proposed (T-05) |
| AC-IAM-PERM-03 | **Given** a user without Customers.CustomersImpersonation (native), **when** they open or post any function it guards, **then** access is denied and nothing changes; **given** a user with it, the function is available. | Proposed (T-05) |
| AC-IAM-PERM-04 | **Given** a user without Customers.CustomerRolesView (native), **when** they open or post any function it guards, **then** access is denied and nothing changes; **given** a user with it, the function is available. | Proposed (T-05) |
| AC-IAM-PERM-05 | **Given** a user without Customers.CustomerRolesCreateEditDelete (native), **when** they open or post any function it guards, **then** access is denied and nothing changes; **given** a user with it, the function is available. | Proposed (T-05) |
| AC-IAM-PERM-06 | **Given** a user without Configuration.ManageACL (native), **when** they open or post any function it guards, **then** access is denied and nothing changes; **given** a user with it, the function is available. | Proposed (T-05) |
| AC-IAM-PERM-07 | **Given** a user without Customers.GDPRManage (native), **when** they open or post any function it guards, **then** access is denied and nothing changes; **given** a user with it, the function is available. | Proposed (T-05) |
| AC-IAM-PERM-08 | **Given** a user without Configuration.ManageMultifactorAuthenticationMethods (native), **when** they open or post any function it guards, **then** access is denied and nothing changes; **given** a user with it, the function is available. | Proposed (T-05) |
| AC-IAM-PERM-09 | **Given** a user without Security.EnableMultiFactorAuthentication (native), **when** they open or post any function it guards, **then** access is denied and nothing changes; **given** a user with it, the function is available. | Proposed (T-05) |
| AC-IAM-PERM-10 | **Given** a user without Configuration.ManageExternalAuthenticationMethods (native), **when** they open or post any function it guards, **then** access is denied and nothing changes; **given** a user with it, the function is available. | Proposed (T-05) |
| AC-IAM-PERM-11 | **Given** a user without Identity.Core.Sessions.View, **when** they open or post any function it guards, **then** access is denied and nothing changes; **given** a user with it, the function is available. | Proposed (T-05) |
| AC-IAM-PERM-12 | **Given** a user without Identity.Core.Sessions.CreateEditDelete, **when** they open or post any function it guards, **then** access is denied and nothing changes; **given** a user with it, the function is available. | Proposed (T-05) |
| AC-IAM-PERM-13 | **Given** a user without Identity.Core.AccessGovernance.CreateEditDelete, **when** they open or post any function it guards, **then** access is denied and nothing changes; **given** a user with it, the function is available. | Proposed (T-05) |
| AC-IAM-PERM-14 | **Given** a user without Identity.Core.AccessReports.View, **when** they open or post any function it guards, **then** access is denied and nothing changes; **given** a user with it, the function is available. | Proposed (T-05) |
| AC-IAM-PERM-15 | **Given** a user without Identity.Core.AuthEvents.View, **when** they open or post any function it guards, **then** access is denied and nothing changes; **given** a user with it, the function is available. | Proposed (T-05) |
| AC-IAM-PERM-16 | **Given** a user without Identity.Core.ConsentTrail.View, **when** they open or post any function it guards, **then** access is denied and nothing changes; **given** a user with it, the function is available. | Proposed (T-05) |
| AC-IAM-PERM-17 | **Given** a user without Identity.Core.TradeAccounts.CreateEditDelete, **when** they open or post any function it guards, **then** access is denied and nothing changes; **given** a user with it, the function is available. | Proposed (T-05) |
| AC-IAM-PERM-18 | **Given** a user without Identity.Core.Agents.CreateEditDelete, **when** they open or post any function it guards, **then** access is denied and nothing changes; **given** a user with it, the function is available. | Proposed (T-05) |
| AC-IAM-PERM-19 | **Given** a user without Identity.Core.AssistedService.Access, **when** they open or post any function it guards, **then** access is denied and nothing changes; **given** a user with it, the function is available. | Proposed (T-05) |
| AC-IAM-PERM-20 | **Given** a user without Identity.Core.Verification.CreateEditDelete, **when** they open or post any function it guards, **then** access is denied and nothing changes; **given** a user with it, the function is available. | Proposed (T-05) |
| AC-IAM-PERM-21 | **Given** a user without Identity.Core.Delegations.CreateEditDelete, **when** they open or post any function it guards, **then** access is denied and nothing changes; **given** a user with it, the function is available. | Proposed (T-05) |
| AC-IAM-PERM-22 | **Given** a user without Configuration.ManageSmsSettings (native, 5.00), **when** they open or post any function it guards, **then** access is denied and nothing changes; **given** a user with it, the function is available. | Proposed (T-05) |

## 5. Source traceability

Traceability of this module to client requirements and catalog features, and requirement coverage, are in the separate traceability document. Each acceptance criterion below names its basis.


## 6. nopCommerce 5.00 baseline and build approach

| PRD ID | Native capability in 5.00.1 | Gap / to build | Code change | Evidence | Confidence |
|---|---|---|---|---|---|
| PRD-IAM-001 | Unchanged from 4.90.8; evidence re-verified in 5.00.1 source: Email registration/login, registration types Standard/EmailValidation/AdminApproval/Disabled; guest becomes registered on registration (same customer record keeps orders). \| 5.00.1: NEW in 5.00 (optional): login by phone with SMS OTP (Libraries/Nop.Core/Domain/Customers/OtpSettings.cs:LoginByPhoneEnabled); incomplete-registration reminder email (Libraries/Nop.Core/Domain/Reminders/ReminderSettings.cs:IncompleteRegistrationEnabled; Libraries/Nop.Services/Reminders/ProcessIncompleteRegistrationsTask.cs; template Reminders.RegistrationFollowUp). | None. | None | Paths are given in the native-capability column (source tag release-5.00.1) | Verified in 4.90.8 source; re-verified in 5.00.1 source |
| PRD-IAM-002 | NEW in 5.00: SMS OTP login and phone verification. OtpSettings (Libraries/Nop.Core/Domain/Customers/OtpSettings.cs: LoginByPhoneEnabled, OtpTimeLife, OtpCountAttemptsToSendCode, OtpFailedAllowedAttempts, OtpTimeToRepeat, OtpLength); Presentation/Nop.Web/Controllers/CustomerController.cs: SendOtp (l.561), login-by-phone redirect (l.478-483), OtpPhoneVerification (l.1376) with flows Login / RegisterEmailValidation / RegisterAdminApproval / RegisterStandard / ChangePhoneNumber (Presentation/Nop.Web/Models/Customer/PhoneVerificationFlowEnum); Customer.PhoneSmsVerified; CustomerRegistrationService.ValidateCustomerByPhoneAsync (Libraries/Nop.Services/Customers/CustomerRegistrationService.cs:205); SMS provider plugin type (Libraries/Nop.Services/Messages/ISmsProvider.cs, SmsPluginManager.cs, SmsService.cs; MessagesSettings.ActiveSmsProviderSystemName; Admin SmsController Providers/MarkAsPrimaryProvider); bundled Plugins/Nop.Plugin.Sms.Twilio (TwilioSettings: AccountSID, AuthToken, PhoneNumber); phone numbers normalised to E.164 with libphonenumber (CustomerController.FormatPhoneNumber l.206-217; CustomerSettings.PhoneNumberValidationUseRegex/Rule removed). | Registration still requires email and password (CustomerRegistrationService.cs:264-281): phone-only sign-up needs a DI override of ICustomerRegistrationService + registration view override. Password recovery is by email only (CustomerController.PasswordRecoverySend uses GetCustomerByEmailAsync): SMS recovery to build. SMS gateway for KE/MW: use Twilio if accepted by client, else an ISmsProvider plugin for the local aggregator (not stated in source which gateway). | Custom plugin (ISmsProvider + DI override) + Theme/view override | Paths are given in the native-capability column (source tag release-5.00.1) | Verified in 4.90.8 source; re-verified in 5.00.1 source |
| PRD-IAM-003 | Unchanged from 4.90.8; evidence re-verified in 5.00.1 source: Password length/complexity, history, lifetime, lockout, recovery link validity (CustomerSettings.PasswordMinLength, PasswordRequire*, UnduplicatedPasswordsNumber, PasswordLifetime, FailedPasswordAllowedAttempts, FailedPasswordLockoutMinutes, PasswordRecoveryLinkDaysValid); CustomerRole.EnablePasswordLifetime. \| 5.00.1: Password recovery remains email-based (CustomerController.PasswordRecoverySend); OTP settings apply to phone login only. | Extra recovery checks for sensitive accounts (security questions, manager confirmation). | Custom plugin | Paths are given in the native-capability column (source tag release-5.00.1) | Verified in 4.90.8 source; re-verified in 5.00.1 source |
| PRD-IAM-004 | Unchanged from 4.90.8; evidence re-verified in 5.00.1 source: MFA framework (Libraries/Nop.Services/Authentication/MultiFactor/IMultiFactorAuthenticationMethod.cs), bundled Google Authenticator plugin; MultiFactorAuthenticationSettings.ForceMultifactorAuthentication forces MFA on every customer holding permission Security.EnableMultiFactorAuthentication. Native enforcement is not role-scoped: the Registered role holds that permission by default (BR-IAM-030). \| 5.00.1: MFA providers in src/Plugins still only Nop.Plugin.MultiFactorAuth.GoogleAuthenticator; MultiFactorAuthenticationType.SMSVerification still has no implementation. NEW 5.00 ISmsService (Libraries/Nop.Services/Messages/ISmsService.cs) can be reused by a custom SMS MFA method. | Email-code, SMS-code and hardware-key (FIDO2/WebAuthn) MFA providers. Scope: Buyer opt-in to MFA with choice of factor (customer-facing MFA settings). | Custom plugin | Paths are given in the native-capability column (source tag release-5.00.1) | Verified in 4.90.8 source; re-verified in 5.00.1 source |
| PRD-IAM-005 | Unchanged from 4.90.8; evidence re-verified in 5.00.1 source: External-auth framework (Libraries/Nop.Services/Authentication/External/IExternalAuthenticationMethod.cs); only Facebook bundled. No SCIM/auto provisioning. \| 5.00.1: Only Nop.Plugin.ExternalAuth.Facebook bundled. NEW 5.00 Plugins/Nop.Plugin.Misc.PunchOut signs in procurement-system buyers from a cXML PunchOutSetupRequest using shared-secret identities (Domain/PunchOutIdentity.cs; Controllers/PunchOutController.cs:81) - procurement punch-out, not OIDC/SAML SSO. | OIDC/SAML plugin for Microsoft Entra / Google; join/leave provisioning. | Custom plugin | Paths are given in the native-capability column (source tag release-5.00.1) | Verified in 4.90.8 source; re-verified in 5.00.1 source |
| PRD-IAM-006 | Unchanged from 4.90.8; evidence re-verified in 5.00.1 source: Auth cookie with no configurable idle timeout; Customer.RequireReLogin invalidates cookie (checked in Libraries/Nop.Services/Authentication/CookieAuthenticationService.cs); OnlineCustomerMinutes for online list. \| 5.00.1: CookieAuthenticationService.cs only adds a MobilePhone claim in 5.00; no idle timeout or concurrent-session setting found. | Idle timeout, concurrent-session limits, admin force-logout action. | Custom plugin | Paths are given in the native-capability column (source tag release-5.00.1) | Verified in 4.90.8 source; re-verified in 5.00.1 source |
| PRD-IAM-007 | Unchanged from 4.90.8; evidence re-verified in 5.00.1 source: Customer roles, permission records per role (4.90 StandardPermission constants), ACL on products/categories/manufacturers/topics/menus, vendor role. \| 5.00.1: New permission constants for new modules, e.g. StandardPermission.Catalog.PRICE_LISTS_VIEW / CREATE_EDIT_DELETE / IMPORT_EXPORT (Libraries/Nop.Services/Security/StandardPermission.cs:76-78). | None for role/permission model. | None | Paths are given in the native-capability column (source tag release-5.00.1) | Verified in 4.90.8 source; re-verified in 5.00.1 source |
| PRD-IAM-008 | Unchanged from 4.90.8; evidence re-verified in 5.00.1 source: Only vendor scoping (Customer.VendorId restricts admin data to own vendor). No store/region/category/value scoping of staff permissions. | Scoped permission model and data filtering in admin queries. | Custom plugin + Core modification | Paths are given in the native-capability column (source tag release-5.00.1) | Verified in 4.90.8 source; re-verified in 5.00.1 source |
| PRD-IAM-009 | Unchanged from 4.90.8; evidence re-verified in 5.00.1 source: None. | Time-boxed delegation of approval rights with audit. | Custom plugin | Paths are given in the native-capability column (source tag release-5.00.1) | Verified in 4.90.8 source; re-verified in 5.00.1 source |
| PRD-IAM-010 | Unchanged from 4.90.8; evidence re-verified in 5.00.1 source: Admin customer search/list, edit, Active flag, impersonation (CustomerController.Impersonate) with activity types Impersonation.Started/Finished; online customers; activity log of admin edits (EditCustomer etc.). | Customer self-deactivate/reactivate (custom plugin). Full 'every action recorded' depends on activity log coverage; customer self-deactivation (MPC FR-016) not native (GDPR delete exists). | Custom plugin | Paths are given in the native-capability column (source tag release-5.00.1) | Verified in 4.90.8 source; re-verified in 5.00.1 source |
| PRD-IAM-011 | Unchanged from 4.90.8; evidence re-verified in 5.00.1 source: Admin creates customers and can SendWelcomeMessage/ReSendActivationMessage; no invitation token flow; no access reviews. | Email invitation with set-password link; periodic access recertification. Scope: admin access audit report (role assignments, privileged accounts, MFA status) over CustomerRole/ACL and MFA settings (custom plugin). | Custom plugin | Paths are given in the native-capability column (source tag release-5.00.1) | Verified in 4.90.8 source; re-verified in 5.00.1 source |
| PRD-IAM-012 | Unchanged from 4.90.8; evidence re-verified in 5.00.1 source: NEW vs 4.70.5: failed-login activity type PublicStore.FailedLogin and customer failed-login email (CustomerSettings.NotifyFailedLoginAttempt; WorkflowMessageService.SendCustomerFailedLoginAttemptNotificationAsync); lockout counters; successful-login activity. | Anomaly detection (geo/IP patterns), alerting, SIEM export. | Custom plugin | Paths are given in the native-capability column (source tag release-5.00.1) | Verified in 4.90.8 source; re-verified in 5.00.1 source |
| PRD-IAM-013 | Unchanged from 4.90.8; evidence re-verified in 5.00.1 source: None (MFA and external-auth extension points only). | WebAuthn/passkey login plugin. | Custom plugin | Paths are given in the native-capability column (source tag release-5.00.1) | Verified in 4.90.8 source; re-verified in 5.00.1 source |
| PRD-IAM-014 | Unchanged from 4.90.8; evidence re-verified in 5.00.1 source: Customer info page and address book (Addresses, AddressAdd/Edit/Delete); Customer.BillingAddressId/ShippingAddressId store last used; address attributes. | Explicit 'set as default address' action in My account. | Theme/view override + Custom plugin | Paths are given in the native-capability column (source tag release-5.00.1) | Verified in 4.90.8 source; re-verified in 5.00.1 source |
| PRD-IAM-015 | Unchanged from 4.90.8; evidence re-verified in 5.00.1 source: Customer attributes (dropdown/radio/text) can capture a preferred channel; pickup points come from Pickup.PickupInStore plugin. | Saved preferred pickup point bound to pickup-point list and used at checkout; channel preference used by notifications. | Custom plugin | Paths are given in the native-capability column (source tag release-5.00.1) | Verified in 4.90.8 source; re-verified in 5.00.1 source |
| PRD-IAM-016 | Unchanged from 4.90.8; evidence re-verified in 5.00.1 source: Privacy-policy acceptance at registration (CustomerSettings.AcceptPrivacyPolicyEnabled), GDPR consent log (GdprSettings.LogPrivacyPolicyConsent; GdprLog). No terms versions, no re-acceptance prompt. | Versioned terms/policies, acceptance per version, forced re-acceptance. | Custom plugin | Paths are given in the native-capability column (source tag release-5.00.1) | Verified in 4.90.8 source; re-verified in 5.00.1 source |
| PRD-IAM-017 | Unchanged from 4.90.8; evidence re-verified in 5.00.1 source: GDPR consents (Libraries/Nop.Core/Domain/Gdpr/GdprConsent.cs), customer GDPR tools: export data and delete account (Presentation/Nop.Web/Controllers/CustomerController.cs:GdprToolsExport,GdprToolsDelete), admin GdprDelete, GDPR log. | Correction-request workflow; consent withdrawal history UI beyond consent checkboxes. | Custom plugin | Paths are given in the native-capability column (source tag release-5.00.1) | Verified in 4.90.8 source; re-verified in 5.00.1 source |
| PRD-IAM-018 | Unchanged from 4.90.8; evidence re-verified in 5.00.1 source: Activity log records logins, profile changes etc. but is admin-only; GDPR log of profile changes (GdprSettings.LogUserProfileChanges). | Customer-facing activity history page including staff access to their data. | Custom plugin | Paths are given in the native-capability column (source tag release-5.00.1) | Verified in 4.90.8 source; re-verified in 5.00.1 source |
| PRD-IAM-019 | Unchanged from 4.90.8; evidence re-verified in 5.00.1 source: Customer entity and events (CustomerRegisteredEvent, entity events) usable for sync; no MPC connector. | Integration plugin to MPC core systems (interface not stated in source). | External system + integration plugin | Paths are given in the native-capability column (source tag release-5.00.1) | Verified in 4.90.8 source; re-verified in 5.00.1 source |
| PRD-IAM-020 | Unchanged from 4.90.8; evidence re-verified in 5.00.1 source: VAT number check only against EU VIES (TaxSettings.EuVatUseWebService); nothing for national ID/tax/mobile-money registries. | External registries (national ID, tax authority, MNO KYC) perform verification; nopCommerce needs an adapter-framework plugin calling them. | External system + integration plugin | Paths are given in the native-capability column (source tag release-5.00.1) | Verified in 4.90.8 source; re-verified in 5.00.1 source |
| PRD-IAM-021 | Unchanged from 4.90.8; evidence re-verified in 5.00.1 source: My account: orders, order details, PDF invoice (OrderController.GetPdfInvoice), return requests; NEW in 4.90 bundled Misc.RFQ adds customer quotes/requests pages. \| 5.00.1: Bundled Misc.RFQ updated in 5.00: customer quote PDF download (Plugins/Nop.Plugin.Misc.RFQ/Controllers/RfqCustomerController.cs:459 PdfDocument, gated by RfqSettings.AllowCustomerGenerateQuotePdf; Services/Pdf/QuoteDocument.cs). | Export of history list (CSV/Excel) for customers. | Custom plugin + Theme/view override | Paths are given in the native-capability column (source tag release-5.00.1) | Verified in 4.90.8 source; re-verified in 5.00.1 source |
| PRD-IAM-022 | Unchanged from 4.90.8; evidence re-verified in 5.00.1 source: None (Customer.Company text field only). \| 5.00.1: No company entity found in 5.00.1 (no Company/B2B class in Libraries). | Company entity, member users with buyer/approver/admin roles, shared addresses and order history. | Custom plugin + Theme/view override | Paths are given in the native-capability column (source tag release-5.00.1) | Verified in 4.90.8 source; re-verified in 5.00.1 source |
| PRD-IAM-023 | Unchanged from 4.90.8; evidence re-verified in 5.00.1 source: Registration type AdminApproval (global CustomerSettings, saved without store scope), Company and VAT number fields, customer attributes (file upload NOT supported for customer attributes), role-based tier prices/ACL to hide trade prices. \| 5.00.1: 5.00: when OtpSettings.LoginByPhoneEnabled, AdminApproval registration also routes through phone OTP verification (CustomerController.cs:1318-1324). | B2B application form with document upload, separate approval queue that grants a trade role. | Custom plugin + Theme/view override | Paths are given in the native-capability column (source tag release-5.00.1) | Verified in 4.90.8 source; re-verified in 5.00.1 source |
| PRD-IAM-024 | Unchanged from 4.90.8; evidence re-verified in 5.00.1 source: Customer.IsTaxExempt, CustomerRole.TaxExempt, Customer.VatNumber/VatNumberStatusId (shown when TaxSettings.EuVatEnabled). | VAT-number UI is labelled/validated for EU VAT; keep EuVatUseWebService off for KE/MW. | None | Paths are given in the native-capability column (source tag release-5.00.1) | Verified in 4.90.8 source; re-verified in 5.00.1 source |
| PRD-IAM-025 | Unchanged from 4.90.8; evidence re-verified in 5.00.1 source: My account navigation pages only; no dashboard or quick-action menu. \| 5.00.1: NEW 5.00: private messages moved from forums into core (Libraries/Nop.Core/Domain/Customers/PrivateMessage.cs, PrivateMessageSettings.cs; Presentation/Nop.Web/Controllers/PrivateMessagesController.cs) - an inbox exists, but no dashboard or quick-action menu. | Customer home dashboard and global quick actions. | Custom plugin + Theme/view override | Paths are given in the native-capability column (source tag release-5.00.1) | Verified in 4.90.8 source; re-verified in 5.00.1 source |
| PRD-IAM-026 | Unchanged from 4.90.8; evidence re-verified in 5.00.1 source: Admin impersonation lets staff place orders as the customer (OrderSettings.AllowAdminsToBuyCallForPriceProducts relates); admin can create customers. | Agent role for outlet staff, outlet entity, agent/outlet stamped on customer and order. | Custom plugin | Paths are given in the native-capability column (source tag release-5.00.1) | Verified in 4.90.8 source; re-verified in 5.00.1 source |
| PRD-IAM-027 | Unchanged from 4.90.8; evidence re-verified in 5.00.1 source: None. | Cost centres and budgets per company user (depends on PRD-IAM-022). | Custom plugin | Paths are given in the native-capability column (source tag release-5.00.1) | Verified in 4.90.8 source; re-verified in 5.00.1 source |


## 7. Feature specifications


### 7.1 PRD-IAM-001 Customer registration and login

| Item | Value |
|---|---|
| Description (baseline) | Customers can create an account with their email address and log in; guests can turn their guest order into an account later. |
| Why it matters | Customers can track orders and reorder easily. |
| Who benefits | Shoppers |
| Phase | P1 |
| Implementation | Configuration — None |
| Depends on | — |
| Status | Ready |

**Use case US-IAM-001-01**

| Attribute | Description |
|---|---|
| User Story | As a shopper, I want to create an account with my email address and a password, so that I can track my orders and buy again with my saved details. |
| Use Case ID | US-IAM-001-01 |
| Use Case Name | To create an account with my email address and a password |
| Actor(s) | • Shopper<br>• Platform (IAM plugin)<br>• SEL-013 (Block and watch lists) |
| Preconditions | • Registration type is Standard. |
| Trigger | A visitor submits a unique email address and a password that meets the policy (IAM-003). |
| Basic Flow | 1. Trigger: a visitor submits a unique email address and a password that meets the policy (IAM-003).<br>2. The system responds: a customer record is created in the Registered role, it is active, the visitor is signed in and the native Customer.WelcomeMessage email is sent (AC-IAM-001-01-01).<br>3. The customer logs in again later: the saved addresses are offered and the earlier orders are listed in My account (AC-IAM-001-01-03). |
| Alternate Flows | Not stated in source |
| Exception Flow | • An account with email E exists: when someone registers with email E, registration is refused with the native message Account.Register.Errors.EmailAlreadyExists and no second record is created (BR-IAM-002) (AC-IAM-001-01-02).<br>• The email, phone or request IP address matches an Active Block entry of the SEL-013 list with scope registration or all: when the registration POST is made (native CustomerController.Register or the IAM mobile registration), no account is created and the SEL-013 block message is shown; the check is the Platform core action filter owned by SEL-013, not an IAM filter (BR-IAM-003) (AC-IAM-001-01-04). |
| Postconditions | • A customer record is created in the Registered role, it is active, the visitor is signed in and the native Customer.WelcomeMessage email is sent (AC-IAM-001-01-01). |
| Business Rules | • BR-IAM-002 — Identifiers: an email address belongs to at most one customer (native check)<br>• BR-IAM-003 — Block lists: registration and login POSTs (native CustomerController.Register and Login, and the IAM plugin mobile registration and mobile login POST actions) are checked against SEL-013 Block entries with scope registration, login or all by the Platform core action filter owned by SEL-013 |
| Notes | • Messages and templates: Account.Register.Errors.EmailAlreadyExists, Customer.WelcomeMessage<br>• Story basis: D; REQ-MPC-FR-001; REQ-KTDA-CUS-005 |
| Readiness | Ready |
| Acceptance Criteria | **AC-IAM-001-01-01** — **Given** registration type is Standard, **when** a visitor submits a unique email address and a password that meets the policy (IAM-003), **then** a customer record is created in the Registered role, it is active, the visitor is signed in and the native Customer.WelcomeMessage email is sent. Basis: D; FIT (CustomerController.Register, CustomerRegistrationService.RegisterCustomerAsync)<br>**AC-IAM-001-01-02** — **Given** an account with email E exists, **when** someone registers with email E, **then** registration is refused with the native message Account.Register.Errors.EmailAlreadyExists and no second record is created (BR-IAM-002). Basis: REQ-MPC-FR-001; FIT<br>**AC-IAM-001-01-03** — **Given** a registered customer has saved addresses and placed orders, **when** the customer logs in again later, **then** the saved addresses are offered and the earlier orders are listed in My account. Basis: REQ-KTDA-CUS-005<br>**AC-IAM-001-01-04** — **Given** the email, phone or request IP address matches an Active Block entry of the SEL-013 list with scope registration or all, **when** the registration POST is made (native CustomerController.Register or the IAM mobile registration), **then** no account is created and the SEL-013 block message is shown; the check is the Platform core action filter owned by SEL-013, not an IAM filter (BR-IAM-003). Basis: see SEL-013 (REQ-MPC-FR-118) |

**Use case US-IAM-001-02**

| Attribute | Description |
|---|---|
| User Story | As a shopper, I want to log in with my email address and password, so that I reach my account. |
| Use Case ID | US-IAM-001-02 |
| Use Case Name | To log in with my email address and password |
| Actor(s) | • Shopper<br>• Platform (IAM plugin) |
| Preconditions | • A registered, active customer without MFA. |
| Trigger | The correct email and password are entered. |
| Basic Flow | 1. Trigger: the correct email and password are entered.<br>2. The system responds: the customer is signed in and LastLoginDateUtc is set; with MFA the second step of IAM-004 follows (AC-IAM-001-02-01). |
| Alternate Flows | Not stated in source |
| Exception Flow | • A registered customer: when a wrong password is entered, login is refused with the native message Account.Login.WrongCredentials and FailedLoginAttempts increases (lockout per IAM-003) (AC-IAM-001-02-02). |
| Postconditions | • The customer is signed in and LastLoginDateUtc is set; with MFA the second step of IAM-004 follows (AC-IAM-001-02-01). |
| Business Rules | • BR-IAM-001 — The registration type (CustomerSettings.UserRegistrationType: Standard, EmailValidation, AdminApproval, Disabled) is one value for the installation<br>• BR-IAM-002 — Identifiers: an email address belongs to at most one customer (native check)<br>• BR-IAM-003 — Block lists: registration and login POSTs (native CustomerController.Register and Login, and the IAM plugin mobile registration and mobile login POST actions) are checked against SEL-013 Block entries with scope registration, login or all by the Platform core action filter owned by SEL-013 |
| Notes | • Messages and templates: Account.Login.WrongCredentials<br>• Story basis: D |
| Readiness | Ready |
| Acceptance Criteria | **AC-IAM-001-02-01** — **Given** a registered, active customer without MFA, **when** the correct email and password are entered, **then** the customer is signed in and LastLoginDateUtc is set; with MFA the second step of IAM-004 follows. Basis: D; FIT (CustomerRegistrationService.ValidateCustomerAsync)<br>**AC-IAM-001-02-02** — **Given** a registered customer, **when** a wrong password is entered, **then** login is refused with the native message Account.Login.WrongCredentials and FailedLoginAttempts increases (lockout per IAM-003). Basis: FIT |

**Use case US-IAM-001-03**

| Attribute | Description |
|---|---|
| User Story | As a guest shopper, I want my guest basket and order to stay with me when I register in the same visit, so that I do not lose what I did as a guest. |
| Use Case ID | US-IAM-001-03 |
| Use Case Name | My guest basket and order to stay with me when I register in the same visit |
| Actor(s) | • Guest shopper<br>• Platform (IAM plugin) |
| Preconditions | • A guest has items in the basket. |
| Trigger | The guest registers in the same browser session. |
| Basic Flow | 1. Trigger: the guest registers in the same browser session.<br>2. The system responds: the guest customer record itself becomes Registered, so its basket and any guest order stay on the account (AC-IAM-001-03-01). |
| Alternate Flows | Not stated in source |
| Exception Flow | Not stated in source |
| Postconditions | • The guest customer record itself becomes Registered, so its basket and any guest order stay on the account (AC-IAM-001-03-01). |
| Business Rules | • BR-IAM-001 — The registration type (CustomerSettings.UserRegistrationType: Standard, EmailValidation, AdminApproval, Disabled) is one value for the installation<br>• BR-IAM-002 — Identifiers: an email address belongs to at most one customer (native check)<br>• BR-IAM-003 — Block lists: registration and login POSTs (native CustomerController.Register and Login, and the IAM plugin mobile registration and mobile login POST actions) are checked against SEL-013 Block entries with scope registration, login or all by the Platform core action filter owned by SEL-013 |
| Notes | • Story basis: D |
| Readiness | Ready |
| Acceptance Criteria | **AC-IAM-001-03-01** — **Given** a guest has items in the basket, **when** the guest registers in the same browser session, **then** the guest customer record itself becomes Registered, so its basket and any guest order stay on the account. Basis: D; FIT (RegisterCustomerAsync converts the current customer record) |

**Use case US-IAM-001-04**

| Attribute | Description |
|---|---|
| User Story | As a client administrator, I want to choose how new accounts are activated: at once, after email confirmation, after my approval, or not at all, so that registration follows our policy. |
| Use Case ID | US-IAM-001-04 |
| Use Case Name | To choose how new accounts are activated: at once, after email confirmation, after my approval, or not at all |
| Actor(s) | • Client administrator<br>• Platform (IAM plugin) |
| Preconditions | • Registration type is AdminApproval. |
| Trigger | A visitor registers. |
| Basic Flow | 1. Trigger: a visitor registers.<br>2. The system responds: the account stays inactive until an administrator activates it in the user administration console (IAM-010) (AC-IAM-001-04-02). |
| Alternate Flows | Not stated in source |
| Exception Flow | • Registration type is EmailValidation: when a visitor registers, the account stays inactive until the link in the native Customer.EmailValidationMessage email is opened; a login before that is refused with Account.Login.WrongCredentials.NotActive (AC-IAM-001-04-01).<br>• Registration type is Disabled: when a visitor opens the registration page, registration is not possible and the native registration-disabled result page is shown (AC-IAM-001-04-03). |
| Postconditions | • The account stays inactive until an administrator activates it in the user administration console (IAM-010) (AC-IAM-001-04-02). |
| Business Rules | • BR-IAM-001 — The registration type (CustomerSettings.UserRegistrationType: Standard, EmailValidation, AdminApproval, Disabled) is one value for the installation<br>• BR-IAM-002 — Identifiers: an email address belongs to at most one customer (native check)<br>• BR-IAM-003 — Block lists: registration and login POSTs (native CustomerController.Register and Login, and the IAM plugin mobile registration and mobile login POST actions) are checked against SEL-013 Block entries with scope registration, login or all by the Platform core action filter owned by SEL-013 |
| Notes | • Messages and templates: Account.Login.WrongCredentials.NotActive, Customer.EmailValidationMessage<br>• Story basis: D; FIT |
| Readiness | Ready |
| Acceptance Criteria | **AC-IAM-001-04-01** — **Given** registration type is EmailValidation, **when** a visitor registers, **then** the account stays inactive until the link in the native Customer.EmailValidationMessage email is opened; a login before that is refused with Account.Login.WrongCredentials.NotActive. Basis: FIT<br>**AC-IAM-001-04-02** — **Given** registration type is AdminApproval, **when** a visitor registers, **then** the account stays inactive until an administrator activates it in the user administration console (IAM-010). Basis: FIT<br>**AC-IAM-001-04-03** — **Given** registration type is Disabled, **when** a visitor opens the registration page, **then** registration is not possible and the native registration-disabled result page is shown. Basis: FIT |

**Use case US-IAM-001-05**

| Attribute | Description |
|---|---|
| User Story | As a member of the public, I want to register without belonging to any organisation, so that anyone can buy from the retail shop. |
| Use Case ID | US-IAM-001-05 |
| Use Case Name | To register without belonging to any organisation |
| Actor(s) | • Member of the public<br>• Platform (IAM plugin) |
| Preconditions | • The retail store uses registration type Standard or EmailValidation and CustomerSettings.CompanyRequired is off. |
| Trigger | A member of the public registers with name, email and password only. |
| Basic Flow | 1. Trigger: a member of the public registers with name, email and password only.<br>2. The system responds: the account is created without any organisation or company field (AC-IAM-001-05-01). |
| Alternate Flows | Not stated in source |
| Exception Flow | Not stated in source |
| Postconditions | • The account is created without any organisation or company field (AC-IAM-001-05-01). |
| Business Rules | • BR-IAM-001 — The registration type (CustomerSettings.UserRegistrationType: Standard, EmailValidation, AdminApproval, Disabled) is one value for the installation<br>• BR-IAM-002 — Identifiers: an email address belongs to at most one customer (native check)<br>• BR-IAM-003 — Block lists: registration and login POSTs (native CustomerController.Register and Login, and the IAM plugin mobile registration and mobile login POST actions) are checked against SEL-013 Block entries with scope registration, login or all by the Platform core action filter owned by SEL-013 |
| Notes | • Story basis: REQ-KTDA-CUS-003; REQ-KTDA-CUS-004 |
| Readiness | Ready |
| Acceptance Criteria | **AC-IAM-001-05-01** — **Given** the retail store uses registration type Standard or EmailValidation and CustomerSettings.CompanyRequired is off, **when** a member of the public registers with name, email and password only, **then** the account is created without any organisation or company field. Basis: REQ-KTDA-CUS-003; REQ-KTDA-CUS-004 |

**Business rules applied:** BR-IAM-001; BR-IAM-002; BR-IAM-003 (§8.1).


### 7.2 PRD-IAM-002 Mobile-number identity with OTP

| Item | Value |
|---|---|
| Description (baseline) | Customers can sign up and log in with their mobile phone number, confirmed by a one-time code sent by SMS, and recover their account by SMS. |
| Why it matters | Malawi Post requires sign-up with a mobile number; customers without email can still have an account. |
| Who benefits | Shoppers |
| Phase | P1 |
| Implementation | Code-level — Custom plugin (ISmsProvider + DI override) + Theme/view override |
| Depends on | PRD-CHN-005 |
| Status | Ready |

**Use case US-IAM-002-01**

| Attribute | Description |
|---|---|
| User Story | As a shopper without an email address, I want to sign up with my mobile number, confirmed by a code sent by SMS, so that I can have an account without email. |
| Use Case ID | US-IAM-002-01 |
| Use Case Name | To sign up with my mobile number, confirmed by a code sent by SMS |
| Actor(s) | • Shopper without an email address<br>• Platform (IAM plugin) |
| Preconditions | • Mobile registration is enabled. |
| Trigger | A visitor enters a mobile number. |
| Basic Flow | 1. Trigger: a visitor enters a mobile number.<br>2. The system responds: the number is normalised to international format (BR-IAM-010), checked against existing PhoneIdentity records, and a one-time code is sent through the SMS gateway (IC-IAM-01) with message Iam.Otp.Sent (AC-IAM-002-01-01).<br>3. The visitor enters the correct code within its validity: a customer record is created in the Registered role with the mobile number as identifier and no email, terms acceptance is recorded (IAM-016) and the visitor is signed in (AC-IAM-002-01-02). |
| Alternate Flows | • A visitor who has an email address registers on the native page with email, password and mobile number while OtpSettings.LoginByPhoneEnabled is on: the native flow verifies the number by code before the result page (AC-IAM-002-01-10).<br>• Customer.Phone is saved in E.164 format and kept equal to PhoneIdentity.NormalisedPhone; codes go through the SMS provider marked primary (AC-IAM-002-01-08, AC-IAM-002-01-09). |
| Exception Flow | • The number already belongs to an account: when a visitor tries to register it, no account is created and message Iam.PhoneInUse is shown with the link to log in (AC-IAM-002-01-03).<br>• A code was sent: when the visitor enters a wrong code more times than the configured maximum, the code is invalidated, message Iam.Otp.TooManyAttempts is shown and a new code can be requested only after the resend interval (BR-IAM-012) (AC-IAM-002-01-04).<br>• A code was sent: when the visitor enters it after its validity ended, it is refused with message Iam.Otp.Expired (AC-IAM-002-01-05).<br>• The SMS gateway is unavailable: when a code is requested, message Iam.Otp.Unavailable is shown, no account is created and the failure is logged (AC-IAM-002-01-06).<br>• IAM calls IC-TRK-06 CheckAllowed (recipient = the number, channel SMS, category Security codes, sender IAM) before each IC-IAM-01 SendCode, and TRK answers Blocked (the number is opted out and the client has not marked Security codes mandatory, BR-TRK-031): when a code is requested for that number, no code is sent, message Iam.Otp.Unavailable is shown and the OtpChallenge is not issued; when TRK answers Allowed the code is sent (BR-IAM-150) (AC-IAM-002-01-07). |
| Postconditions | • A customer record is created in the Registered role with the mobile number as identifier and no email, terms acceptance is recorded (IAM-016) and the visitor is signed in (AC-IAM-002-01-02). |
| Business Rules | • BR-IAM-010 — Mobile numbers are stored in international format<br>• BR-IAM-012 — One-time codes are random, single-use, bound to one purpose (register, login, recover, confirm change, assisted consent, MFA), stored only as a hash, and never logged in clear<br>• BR-IAM-150 — Messages: IAM notifications (welcome and validation emails, invitation, new-country login, trade decision, privacy-request updates, deactivation and reactivation) are sent by TRK-005: native templates through IWorkflowMessageService (TRK-005 override) and IAM templates through the TRK-005 engine (IAM registers them through IC-TRK-04 RegisterEventCode at installation |
| Notes | • Messages and templates: Iam.Otp.Expired, Iam.Otp.Sent, Iam.Otp.TooManyAttempts, Iam.Otp.Unavailable, Iam.PhoneInUse<br>• Contracts: IC-IAM-01, IC-TRK-06<br>• Story basis: D; REQ-MPC-FR-001 |
| Readiness | Ready |
| Acceptance Criteria | **AC-IAM-002-01-01** — **Given** mobile registration is enabled, **when** a visitor enters a mobile number, **then** the number is normalised to international format (BR-IAM-010), checked against existing PhoneIdentity records, and a one-time code is sent through the SMS gateway (IC-IAM-01) with message Iam.Otp.Sent. Basis: D; REQ-MPC-FR-001<br>**AC-IAM-002-01-02** — **Given** a code was sent, **when** the visitor enters the correct code within its validity, **then** a customer record is created in the Registered role with the mobile number as identifier and no email, terms acceptance is recorded (IAM-016) and the visitor is signed in. Basis: REQ-MPC-FR-001; FIT (native RegisterCustomerAsync still rejects an empty email and an empty password in 5.00.1, Libraries/Nop.Services/Customers/CustomerRegistrationService.cs:264-281, so the IAM override applies, BR-IAM-011)<br>**AC-IAM-002-01-03** — **Given** the number already belongs to an account, **when** a visitor tries to register it, **then** no account is created and message Iam.PhoneInUse is shown with the link to log in. Basis: REQ-MPC-FR-001<br>**AC-IAM-002-01-04** — **Given** a code was sent, **when** the visitor enters a wrong code more times than the configured maximum, **then** the code is invalidated, message Iam.Otp.TooManyAttempts is shown and a new code can be requested only after the resend interval (BR-IAM-012). Basis: Proposed<br>**AC-IAM-002-01-05** — **Given** a code was sent, **when** the visitor enters it after its validity ended, **then** it is refused with message Iam.Otp.Expired. Basis: Proposed<br>**AC-IAM-002-01-06** — **Given** the SMS gateway is unavailable, **when** a code is requested, **then** message Iam.Otp.Unavailable is shown, no account is created and the failure is logged. Basis: Proposed<br>**AC-IAM-002-01-07** — **Given** IAM calls IC-TRK-06 CheckAllowed (recipient = the number, channel SMS, category Security codes, sender IAM) before each IC-IAM-01 SendCode, and TRK answers Blocked (the number is opted out and the client has not marked Security codes mandatory, BR-TRK-031), **when** a code is requested for that number, **then** no code is sent, message Iam.Otp.Unavailable is shown and the OtpChallenge is not issued; when TRK answers Allowed the code is sent (BR-IAM-150). Basis: Proposed (owner decision: messages outside TRK respect TRK-006 opt-outs; BR-TRK-026)<br>**AC-IAM-002-01-08** — **Given** an account is created or a mobile number is changed (IAM registration, native registration, My account), **when** the number is saved, **then** Customer.Phone is saved in E.164 format and kept equal to PhoneIdentity.NormalisedPhone, so the native lookup (ICustomerService.GetCustomerByPhoneAsync: active, not deleted, verified number first) finds the account; a number typed in local format is converted by BR-IAM-010 before the native login or registration action runs, because the native parser expects the international prefix and returns no number otherwise. Basis: D; REQ-MPC-FR-001; FIT (Libraries/Nop.Services/Customers/CustomerService.cs:578-594; Presentation/Nop.Web/Controllers/CustomerController.cs:206-223; Presentation/Nop.Web.Framework/Validators/PhoneNumberPropertyValidator.cs:41-61); Proposed (local-format conversion); VER-500<br>**AC-IAM-002-01-09** — **Given** the client has chosen an SMS provider, **when** an administrator holding Configuration.ManageSmsSettings opens Configuration > SMS providers, **then** the provider plugin is installed and marked primary (MessagesSettings.ActiveSmsProviderSystemName); native login codes and the IAM codes sent through IC-IAM-01 use that provider; the bundled Sms.Twilio plugin is used only if the client accepts Twilio, otherwise the local aggregator adapter of CHN-005 is registered as an ISmsProvider plugin. Basis: REQ-MPC-FR-001; FIT (Libraries/Nop.Services/Messages/ISmsProvider.cs; Libraries/Nop.Core/Domain/Messages/MessagesSettings.cs:25; Presentation/Nop.Web/Areas/Admin/Controllers/SmsController.cs:46-65; StandardPermission.Configuration.MANAGE_SMS_SETTINGS; Plugins/Nop.Plugin.Sms.Twilio); see CHN-005; VER-500<br>**AC-IAM-002-01-10** — **Given** OtpSettings.LoginByPhoneEnabled is on and a visitor registers on the native page with email, password and mobile number, **when** registration succeeds, **then** the native flow sends a code and verifies the number (PhoneVerificationFlowEnum RegisterStandard, RegisterEmailValidation or RegisterAdminApproval) before the result page; a number already verified on another account is refused with Account.IsAlreadyExistsVerifiedPhoneNumber. Basis: REQ-MPC-FR-001; FIT (Presentation/Nop.Web/Controllers/CustomerController.cs:1055-1062, 1311-1336; Libraries/Nop.Services/Customers/CustomerService.cs:605-615); VER-500 |

**Use case US-IAM-002-02**

| Attribute | Description |
|---|---|
| User Story | As a shopper, I want to log in with my mobile number and a one-time code, so that I can sign in from any phone. |
| Use Case ID | US-IAM-002-02 |
| Use Case Name | To log in with my mobile number and a one-time code |
| Actor(s) | • Shopper<br>• Platform (IAM plugin) |
| Preconditions | • A customer with a registered mobile number. |
| Trigger | The customer requests a login code and enters it correctly. |
| Basic Flow | 1. Trigger: the customer requests a login code and enters it correctly.<br>2. The system responds (native in nopCommerce 5.00): the code is sent through ISmsService to the active ISmsProvider, ValidateCustomerByPhoneAsync sets LastLoginDateUtc and Customer.PhoneSmsVerified, and the customer is signed in (AC-IAM-002-02-04).<br>3. The customer logs in with email and password, or with mobile number and code: both routes sign in the same customer record (AC-IAM-002-02-02).<br>4. A customer without an email address makes later requests: the IAM IAuthenticationService override resolves the customer (BR-IAM-011) (AC-IAM-002-02-06). |
| Alternate Flows | Not stated in source |
| Exception Flow | • A customer enters an expired code, wrong codes up to OtpSettings.OtpFailedAllowedAttempts, or requests codes beyond the send limit: the native messages PhoneVerification.OtpCode.Error.Expired, Locked or AttemptLimit are shown and no sign-in happens (AC-IAM-002-02-05).<br>• The customer is locked out after wrong passwords, or holds an MFA-required or sensitive role: the IAM filter refuses code-only sign-in (BR-IAM-013) (AC-IAM-002-02-07).<br>• AC-IAM-002-02-01 and AC-IAM-002-02-03 are withdrawn (VER-500): login by code and the code lock are native. |
| Postconditions | • The customer is signed in by the native code login; customers without email are resolved by the IAM IAuthenticationService override (BR-IAM-011) (AC-IAM-002-02-04, AC-IAM-002-02-06). |
| Business Rules | • BR-IAM-011 — Mobile identity: login by mobile number and code is native in nopCommerce 5.00 (OtpSettings.LoginByPhoneEnabled, ValidateCustomerByPhoneAsync) and is not rebuilt<br>• BR-IAM-012 — One-time codes are random, single-use, bound to one purpose (register, login, recover, confirm change, assisted consent, MFA), stored only as a hash, and never logged in clear<br>• BR-IAM-013 — Native code login (5.00) does not check the password lockout or MFA: an IAM global action filter on the native code-verification action refuses sign-in for a customer whose CannotLoginUntilDateUtc is in the future, and for members of MFA-required or sensitive roles requires the password step and the second factor (BR-IAM-030, BR-IAM-020) |
| Notes | • Messages and templates: Account.Login.WrongCredentials, Account.Login.WrongCredentials.LockedOut, PhoneVerification.OtpCode.Error.Expired, PhoneVerification.OtpCode.Error.Locked, PhoneVerification.OtpCode.Error.AttemptLimit (native)<br>• Story basis: D; REQ-MPC-FR-002 |
| Readiness | Ready |
| Acceptance Criteria | **AC-IAM-002-02-01** — **Given** a customer with a registered mobile number, **when** the customer requests a login code and enters it correctly, **then** Withdrawn (VER-500): now native — nopCommerce 5.00.1 signs in by mobile number and one-time code (OtpSettings.LoginByPhoneEnabled; CustomerController.Login, SendOtp and CommonVerificationOtp; CustomerRegistrationService.ValidateCustomerByPhoneAsync), verified by AC-IAM-002-02-04; resolution of customers without an email address stays an IAM override and is specified in AC-IAM-002-02-06. Superseded text: the customer is signed in through ICustomerRegistrationService.SignInCustomerAsync and later requests resolve the customer through the IAM IAuthenticationService override (BR-IAM-011). Basis: VER-500; FIT (Presentation/Nop.Web/Controllers/CustomerController.cs:478-483, 561-647, 649-744; Libraries/Nop.Services/Customers/CustomerRegistrationService.cs:203-226)<br>**AC-IAM-002-02-02** — **Given** a customer has both an email address and a mobile number, **when** the customer logs in with email and password, or with mobile number and code, **then** both routes sign in the same customer record. Basis: REQ-MPC-FR-001; FIT (native in 5.00.1: CustomerController.Login with LoginByPhone, CustomerController.cs:478-483)<br>**AC-IAM-002-02-03** — **Given** a customer enters wrong login codes, **when** the native lockout threshold is reached, **then** Withdrawn (VER-500): now native — nopCommerce 5.00.1 locks the login code itself after OtpSettings.OtpFailedAllowedAttempts wrong entries (CustomerController.IsLockedOtpCode, CommonVerificationOtp), verified by AC-IAM-002-02-05; the password lockout (CannotLoginUntilDateUtc) is applied to code login by AC-IAM-002-02-07. Superseded text: the account is locked out exactly as for wrong passwords (CannotLoginUntilDateUtc, IAM-003). Basis: VER-500; REQ-MPC-FR-002; FIT (Presentation/Nop.Web/Controllers/CustomerController.cs:432-435, 675-700)<br>**AC-IAM-002-02-04** — **Given** OtpSettings.LoginByPhoneEnabled is on, an SMS provider is active and a registered, active customer has Customer.Phone stored in international (E.164) format, **when** the customer chooses login by phone on the native login page, requests a code and enters it correctly, **then** the native flow signs the customer in: the code (OtpSettings.OtpLength digits) is sent through ISmsService to the active ISmsProvider, ValidateCustomerByPhoneAsync sets LastLoginDateUtc and Customer.PhoneSmsVerified, and the customer is signed in; a number with no account gets the generic Account.Login.WrongCredentials. Basis: REQ-MPC-FR-002; FIT (Libraries/Nop.Core/Domain/Customers/OtpSettings.cs:13-39; Presentation/Nop.Web/Controllers/CustomerController.cs:478-483, 561-647, 703-711; Libraries/Nop.Services/Customers/CustomerRegistrationService.cs:203-226); VER-500<br>**AC-IAM-002-02-05** — **Given** the native code settings are set per client (OtpSettings.OtpTimeLife in seconds, OtpLength, OtpFailedAllowedAttempts, OtpCountAttemptsToSendCode, OtpTimeToRepeat in minutes; defaults not stated in source), **when** a customer enters an expired code, enters wrong codes up to the allowed number, or requests codes beyond the send limit, **then** the native messages PhoneVerification.OtpCode.Error.Expired, PhoneVerification.OtpCode.Error.Locked and PhoneVerification.OtpCode.Error.AttemptLimit are shown and no sign-in happens; the one-time codes IAM sends itself (registration, recovery, second factor, BR-IAM-012) use the same OtpSettings values, so a client sets code rules once. Basis: REQ-MPC-FR-002; FIT (Presentation/Nop.Web/Controllers/CustomerController.cs:595-618, 675-700); Proposed (one set of code settings); VER-500<br>**AC-IAM-002-02-06** — **Given** a customer who registered by mobile number has no email address, **when** the customer signs in by mobile number and code and makes later requests, **then** the IAM IAuthenticationService override resolves the customer from the sign-in claims (BR-IAM-011), because the native cookie service adds a mobile-phone claim at sign-in but resolves customers only by the username or email claim and then reads the current password record. Basis: REQ-MPC-FR-002; FIT (Libraries/Nop.Services/Authentication/CookieAuthenticationService.cs:58-59, 110-133)<br>**AC-IAM-002-02-07** — **Given** a customer is locked out after wrong passwords (CannotLoginUntilDateUtc in the future), or holds a role listed in the MFA-required roles setting (IAM-004) or a role listed as sensitive (IAM-003), **when** the customer completes a native login by mobile number and code, **then** the IAM filter on the native code verification refuses the sign-in with the native message Account.Login.WrongCredentials.LockedOut for a locked-out customer, and for an MFA-required or sensitive role requires the password step and the second factor instead; reason: ValidateCustomerByPhoneAsync checks neither the lockout nor MFA (BR-IAM-013). Basis: Proposed; FIT (Libraries/Nop.Services/Customers/CustomerRegistrationService.cs:203-226; Presentation/Nop.Web/Controllers/CustomerController.cs:703-711); VER-500 |

**Use case US-IAM-002-03**

| Attribute | Description |
|---|---|
| User Story | As a shopper, I want to recover my account by SMS when I cannot log in, so that I regain access without email. |
| Use Case ID | US-IAM-002-03 |
| Use Case Name | To recover my account by SMS when I cannot log in |
| Actor(s) | • Shopper<br>• Platform (IAM plugin) |
| Preconditions | • A customer with a registered mobile number cannot log in. |
| Trigger | The customer chooses recovery by SMS and enters the code correctly. |
| Basic Flow | 1. Trigger: the customer chooses recovery by SMS and enters the code correctly.<br>2. The system responds: the customer can set a new password (where passwords are used) or is signed in, and AUD-IAM-002 is written (AC-IAM-002-03-01). |
| Alternate Flows | Not stated in source |
| Exception Flow | • The customer is in a sensitive role (IAM-003): when recovery by SMS is requested, an SMS code alone does not restore access; the extra checks of BR-IAM-020 apply (AC-IAM-002-03-02). |
| Postconditions | • The customer can set a new password (where passwords are used) or is signed in, and AUD-IAM-002 is written (AC-IAM-002-03-01). |
| Business Rules | • BR-IAM-020 — For accounts holding a role listed as sensitive, password recovery by email link or SMS code alone is not allowed: an IAM global action filter on CustomerController.PasswordRecoverySend [POST] stops the native token, opens a recovery request and shows the same neutral message as for other accounts |
| Notes | • Audit events: AUD-IAM-002<br>• Story basis: D; REQ-MPC-FR-003 |
| Readiness | Ready |
| Acceptance Criteria | **AC-IAM-002-03-01** — **Given** a customer with a registered mobile number cannot log in, **when** the customer chooses recovery by SMS and enters the code correctly, **then** the customer can set a new password (where passwords are used) or is signed in, and AUD-IAM-002 is written. Basis: REQ-MPC-FR-003<br>**AC-IAM-002-03-02** — **Given** the customer is in a sensitive role (IAM-003), **when** recovery by SMS is requested, **then** an SMS code alone does not restore access; the extra checks of BR-IAM-020 apply. Basis: Proposed |

**Use case US-IAM-002-04**

| Attribute | Description |
|---|---|
| User Story | As a client administrator, I want to choose which sign-in factors buyers use (password, SMS code), so that authentication matches our security policy. |
| Use Case ID | US-IAM-002-04 |
| Use Case Name | To choose which sign-in factors buyers use (password, SMS code) |
| Actor(s) | • Client administrator<br>• Platform (IAM plugin) |
| Preconditions | • The buyer login factor setting is "password" or "SMS code" or "either". |
| Trigger | A buyer opens the login page. |
| Basic Flow | 1. Trigger: a buyer opens the login page.<br>2. The system responds: only the configured factors are offered; "either" is the native OtpSettings.LoginByPhoneEnabled on, "password" is it off, "SMS code" also hides the email and password fields (AC-IAM-002-04-01). |
| Alternate Flows | Not stated in source |
| Exception Flow | Not stated in source |
| Postconditions | • Only the configured factors are offered (AC-IAM-002-04-01). |
| Business Rules | • BR-IAM-010 — Mobile numbers are stored in international format<br>• BR-IAM-011 — Mobile identity: login by mobile number and code is native in nopCommerce 5.00 (OtpSettings.LoginByPhoneEnabled, ValidateCustomerByPhoneAsync) and is not rebuilt<br>• BR-IAM-012 — One-time codes are random, single-use, bound to one purpose (register, login, recover, confirm change, assisted consent, MFA), stored only as a hash, and never logged in clear<br>• BR-IAM-002 — Identifiers: an email address belongs to at most one customer (native check)<br>• BR-IAM-003 — Block lists: registration and login POSTs (native CustomerController.Register and Login, and the IAM plugin mobile registration and mobile login POST actions) are checked against SEL-013 Block entries with scope registration, login or all by the Platform core action filter owned by SEL-013<br>• BR-IAM-150 — Messages: IAM notifications (welcome and validation emails, invitation, new-country login, trade decision, privacy-request updates, deactivation and reactivation) are sent by TRK-005: native templates through IWorkflowMessageService (TRK-005 override) and IAM templates through the TRK-005 engine (IAM registers them through IC-TRK-04 RegisterEventCode at installation |
| Notes | • Story basis: REQ-MPC-FR-002 |
| Readiness | Ready |
| Acceptance Criteria | **AC-IAM-002-04-01** — **Given** the buyer login factor setting is "password" or "SMS code" or "either", **when** a buyer opens the login page, **then** only the configured factors are offered: "either" is the native OtpSettings.LoginByPhoneEnabled on (the login page offers email and password, and mobile number and code); "password" is LoginByPhoneEnabled off; "SMS code" is LoginByPhoneEnabled on with the email and password fields hidden by the IAM login view override. Basis: REQ-MPC-FR-002; FIT (Libraries/Nop.Core/Domain/Customers/OtpSettings.cs:13) |

**Business rules applied:** BR-IAM-010; BR-IAM-011; BR-IAM-012; BR-IAM-013; BR-IAM-002; BR-IAM-003; BR-IAM-150 (§8.1).


### 7.3 PRD-IAM-003 Password policy, lockout and recovery

| Item | Value |
|---|---|
| Description (baseline) | Rules for password strength and expiry, temporary lock after too many wrong attempts, and password reset by email. For sensitive accounts, recovery needs extra checks such as security questions or confirmation by a manager. |
| Why it matters | Protects accounts from being guessed or stolen. |
| Who benefits | All users |
| Phase | P1 |
| Implementation | Code-level — Custom plugin |
| Depends on | — |
| Status | Ready |

**Use case US-IAM-003-01**

| Attribute | Description |
|---|---|
| User Story | As a client administrator, I want to set password length, complexity, reuse and expiry rules, so that weak passwords are not accepted. |
| Use Case ID | US-IAM-003-01 |
| Use Case Name | To set password length, complexity, reuse and expiry rules |
| Actor(s) | • Client administrator<br>• Platform (IAM plugin) |
| Preconditions | • CustomerSettings.PasswordLifetime is set and the user role has EnablePasswordLifetime on. |
| Trigger | The password is older than the lifetime. |
| Basic Flow | 1. Trigger: the password is older than the lifetime.<br>2. The system responds: every request redirects the user to change the password (native ValidatePasswordAttribute) (AC-IAM-003-01-03). |
| Alternate Flows | Not stated in source |
| Exception Flow | • CustomerSettings.PasswordMinLength, PasswordMaxLength and PasswordRequireLowercase / Uppercase / Digit / NonAlphanumeric are set: when a user submits a password that breaks one of them at registration, change or reset, the password is refused with the native validation message for that rule (AC-IAM-003-01-01).<br>• CustomerSettings.UnduplicatedPasswordsNumber is greater than 0: when a user sets one of that many previous passwords, the password is refused (AC-IAM-003-01-02). |
| Postconditions | • Every request redirects the user to change the password (native ValidatePasswordAttribute) (AC-IAM-003-01-03). |
| Business Rules | • BR-IAM-020 — For accounts holding a role listed as sensitive, password recovery by email link or SMS code alone is not allowed: an IAM global action filter on CustomerController.PasswordRecoverySend [POST] stops the native token, opens a recovery request and shows the same neutral message as for other accounts<br>• BR-IAM-021 — Password rules use only the native CustomerSettings values (length, complexity, reuse, lifetime, lockout, recovery link validity) |
| Notes | • Story basis: D; REQ-MPC-FR-021 |
| Readiness | Ready |
| Acceptance Criteria | **AC-IAM-003-01-01** — **Given** CustomerSettings.PasswordMinLength, PasswordMaxLength and PasswordRequireLowercase / Uppercase / Digit / NonAlphanumeric are set, **when** a user submits a password that breaks one of them at registration, change or reset, **then** the password is refused with the native validation message for that rule. Basis: REQ-MPC-FR-021; FIT<br>**AC-IAM-003-01-02** — **Given** CustomerSettings.UnduplicatedPasswordsNumber is greater than 0, **when** a user sets one of that many previous passwords, **then** the password is refused. Basis: FIT<br>**AC-IAM-003-01-03** — **Given** CustomerSettings.PasswordLifetime is set and the user role has EnablePasswordLifetime on, **when** the password is older than the lifetime, **then** every request redirects the user to change the password (native ValidatePasswordAttribute). Basis: FIT |

**Use case US-IAM-003-02**

| Attribute | Description |
|---|---|
| User Story | As a client administrator, I want accounts to be locked for a time after too many wrong passwords, so that passwords cannot be guessed. |
| Use Case ID | US-IAM-003-02 |
| Use Case Name | Accounts to be locked for a time after too many wrong passwords |
| Actor(s) | • Client administrator<br>• Platform (IAM plugin) |
| Preconditions | • CustomerSettings.FailedPasswordAllowedAttempts is greater than 0. |
| Trigger | A user enters a wrong password that many times. |
| Basic Flow | 1. Trigger: a user enters a wrong password that many times.<br>2. The system responds: CannotLoginUntilDateUtc is set to now plus FailedPasswordLockoutMinutes and further logins return the native LockedOut message until then (AC-IAM-003-02-01).<br>3. A wrong password is entered for an existing account: the native Customer.FailedLoginAttempt email is sent to the account owner (AC-IAM-003-02-02). |
| Alternate Flows | Not stated in source |
| Exception Flow | Not stated in source |
| Postconditions | • CannotLoginUntilDateUtc is set to now plus FailedPasswordLockoutMinutes and further logins return the native LockedOut message until then (AC-IAM-003-02-01). |
| Business Rules | • BR-IAM-020 — For accounts holding a role listed as sensitive, password recovery by email link or SMS code alone is not allowed: an IAM global action filter on CustomerController.PasswordRecoverySend [POST] stops the native token, opens a recovery request and shows the same neutral message as for other accounts<br>• BR-IAM-021 — Password rules use only the native CustomerSettings values (length, complexity, reuse, lifetime, lockout, recovery link validity) |
| Notes | • Messages and templates: Customer.FailedLoginAttempt<br>• Story basis: D; REQ-MPC-FR-021 |
| Readiness | Ready |
| Acceptance Criteria | **AC-IAM-003-02-01** — **Given** CustomerSettings.FailedPasswordAllowedAttempts is greater than 0, **when** a user enters a wrong password that many times, **then** CannotLoginUntilDateUtc is set to now plus FailedPasswordLockoutMinutes and further logins return the native LockedOut message until then. Basis: REQ-MPC-FR-021; FIT<br>**AC-IAM-003-02-02** — **Given** CustomerSettings.NotifyFailedLoginAttempt is on, **when** a wrong password is entered for an existing account, **then** the native Customer.FailedLoginAttempt email is sent to the account owner. Basis: FIT |

**Use case US-IAM-003-03**

| Attribute | Description |
|---|---|
| User Story | As a shopper, I want to reset my password through a link sent by email, so that I regain access myself. |
| Use Case ID | US-IAM-003-03 |
| Use Case Name | To reset my password through a link sent by email |
| Actor(s) | • Shopper<br>• Platform (IAM plugin) |
| Preconditions | • An active account. |
| Trigger | The owner requests a reset with the account email. |
| Basic Flow | 1. Trigger: the owner requests a reset with the account email.<br>2. The system responds: the native Customer.PasswordRecovery email with a one-time link is sent; the link expires after PasswordRecoveryLinkDaysValid days and cannot be used twice (AC-IAM-003-03-01).<br>3. A password is changed: sessions signed in before the change are signed out at their next request (AC-IAM-003-03-02). |
| Alternate Flows | Not stated in source |
| Exception Flow | Not stated in source |
| Postconditions | • Sessions signed in before the change are signed out at their next request (AC-IAM-003-03-02). |
| Business Rules | • BR-IAM-020 — For accounts holding a role listed as sensitive, password recovery by email link or SMS code alone is not allowed: an IAM global action filter on CustomerController.PasswordRecoverySend [POST] stops the native token, opens a recovery request and shows the same neutral message as for other accounts<br>• BR-IAM-021 — Password rules use only the native CustomerSettings values (length, complexity, reuse, lifetime, lockout, recovery link validity) |
| Notes | • Messages and templates: Customer.PasswordRecovery<br>• Story basis: D; REQ-MPC-FR-003 |
| Readiness | Ready |
| Acceptance Criteria | **AC-IAM-003-03-01** — **Given** an active account, **when** the owner requests a reset with the account email, **then** the native Customer.PasswordRecovery email with a one-time link is sent; the link expires after PasswordRecoveryLinkDaysValid days and cannot be used twice. Basis: REQ-MPC-FR-003; FIT<br>**AC-IAM-003-03-02** — **Given** CustomerSettings.RequiredReLoginAfterPasswordChange is on, **when** a password is changed, **then** sessions signed in before the change are signed out at their next request. Basis: FIT (CookieAuthenticationService) |

**Use case US-IAM-003-04**

| Attribute | Description |
|---|---|
| User Story | As a client administrator, I want recovery of sensitive accounts to need extra checks such as security questions or confirmation by a manager, so that stolen email access alone does not give control of a sensitive account. |
| Use Case ID | US-IAM-003-04 |
| Use Case Name | Recovery of sensitive accounts to need extra checks such as security questions or confirmation by a manager |
| Actor(s) | • Client administrator<br>• Platform (IAM plugin) |
| Preconditions | • The account holds a role listed as sensitive. |
| Trigger | Password recovery is requested for it. |
| Basic Flow | 1. Trigger: password recovery is requested for it.<br>2. The system responds: no native recovery link is issued (IAM action filter on CustomerController.PasswordRecoverySend [POST]), a recovery request is opened and the same neutral message Iam.RecoveryRequestReceived is shown as for other accounts (BR-IAM-020) (AC-IAM-003-04-01).<br>3. The user answers all questions correctly: a one-time reset link is issued; a wrong answer counts as a failed attempt (AC-IAM-003-04-02).<br>4. Another user holding Customers.CustomersCreateEditDelete confirms it: a one-time reset link is issued; the requester cannot confirm their own request; the decision is audited (AUD-IAM-003) (AC-IAM-003-04-03). |
| Alternate Flows | Not stated in source |
| Exception Flow | Not stated in source |
| Postconditions | • A one-time reset link is issued; the requester cannot confirm their own request; the decision is audited (AUD-IAM-003) (AC-IAM-003-04-03). |
| Business Rules | • BR-IAM-020 — For accounts holding a role listed as sensitive, password recovery by email link or SMS code alone is not allowed: an IAM global action filter on CustomerController.PasswordRecoverySend [POST] stops the native token, opens a recovery request and shows the same neutral message as for other accounts |
| Notes | • Messages and templates: Iam.RecoveryRequestReceived<br>• Permissions: Customers.CustomersCreateEditDelete<br>• Audit events: AUD-IAM-003<br>• Story basis: D; FC-M10-016 |
| Readiness | Ready |
| Acceptance Criteria | **AC-IAM-003-04-01** — **Given** the account holds a role listed as sensitive, **when** password recovery is requested for it, **then** no native recovery link is issued (IAM action filter on CustomerController.PasswordRecoverySend [POST]), a recovery request is opened and the same neutral message Iam.RecoveryRequestReceived is shown as for other accounts (BR-IAM-020). Basis: D; FIT<br>**AC-IAM-003-04-02** — **Given** a recovery request with security questions, **when** the user answers all questions correctly, **then** a one-time reset link is issued; a wrong answer counts as a failed attempt. Basis: D; FC-M10-016<br>**AC-IAM-003-04-03** — **Given** a recovery request needing manager confirmation, **when** another user holding Customers.CustomersCreateEditDelete confirms it, **then** a one-time reset link is issued; the requester cannot confirm their own request; the decision is audited (AUD-IAM-003). Basis: D; FC-M10-016 |

**Business rules applied:** BR-IAM-020; BR-IAM-021 (§8.1).


### 7.4 PRD-IAM-004 Multi-factor authentication by role

| Item | Value |
|---|---|
| Description (baseline) | Staff in sensitive roles must use a second check when logging in: a code from an authenticator app, a code sent by email or SMS, or a hardware security key. Buyers can also switch on a second login check for their own accounts and choose the factor (SMS, email or authenticator app). |
| Why it matters | Protects admin and finance accounts even if a password is stolen. |
| Who benefits | Client staff |
| Phase | P1 |
| Implementation | Code-level — Custom plugin |
| Depends on | — |
| Status | Ready |

**Use case US-IAM-004-01**

| Attribute | Description |
|---|---|
| User Story | As a client administrator, I want staff in sensitive roles to complete a second check at every login, so that an account stays safe if a password is stolen. |
| Use Case ID | US-IAM-004-01 |
| Use Case Name | Staff in sensitive roles to complete a second check at every login |
| Actor(s) | • Client administrator<br>• Platform (IAM plugin) |
| Preconditions | • Role R is listed in the MFA-required roles setting. |
| Trigger | A member of R without a configured MFA provider is signed in. |
| Basic Flow | 1. Trigger: a member of R without a configured MFA provider is signed in.<br>2. The system responds: every request is redirected to the native MFA settings page (route MultiFactorAuthenticationSettings) with message Iam.MfaRequired until a provider is configured (BR-IAM-030) (AC-IAM-004-01-01).<br>3. The correct password is entered: ValidateCustomerAsync returns MultiFactorAuthenticationRequired and the login completes only after the provider verification succeeds (AC-IAM-004-01-02).<br>4. MultiFactorAuthenticationSettings.ForceMultifactorAuthentication is inspected: it is off, because the native filter would force every holder of Security.EnableMultiFactorAuthentication, including the Registered role; MFA by role is enforced by the IAM filter only (AC-IAM-004-01-03).<br>5. The member next makes a request: the member must configure a provider again before continuing, and the removal is audited (AUD-IAM-004) (AC-IAM-004-01-04). |
| Alternate Flows | Not stated in source |
| Exception Flow | Not stated in source |
| Postconditions | • The member must configure a provider again before continuing, and the removal is audited (AUD-IAM-004) (AC-IAM-004-01-04). |
| Business Rules | • BR-IAM-030 — MFA by role: the setting "MFA-required roles" lists role system names |
| Notes | • Messages and templates: Iam.MfaRequired<br>• Permissions: Security.EnableMultiFactorAuthentication<br>• Audit events: AUD-IAM-004<br>• Story basis: D; REQ-MPC-FR-012; REQ-MPC-FR-021 |
| Readiness | Ready |
| Acceptance Criteria | **AC-IAM-004-01-01** — **Given** role R is listed in the MFA-required roles setting, **when** a member of R without a configured MFA provider is signed in, **then** every request is redirected to the native MFA settings page (route MultiFactorAuthenticationSettings) with message Iam.MfaRequired until a provider is configured (BR-IAM-030). Basis: REQ-MPC-FR-012; REQ-MPC-FR-021; FIT<br>**AC-IAM-004-01-02** — **Given** a member of R has a configured provider, **when** the correct password is entered, **then** ValidateCustomerAsync returns MultiFactorAuthenticationRequired and the login completes only after the provider verification succeeds. Basis: REQ-MPC-FR-012; FIT<br>**AC-IAM-004-01-03** — **Given** the product is configured, **when** MultiFactorAuthenticationSettings.ForceMultifactorAuthentication is inspected, **then** it is off, because the native filter would force every holder of Security.EnableMultiFactorAuthentication, including the Registered role; MFA by role is enforced by the IAM filter only. Basis: FIT (ForceMultiFactorAuthenticationAttribute; DefaultPermissionConfigManager)<br>**AC-IAM-004-01-04** — **Given** an administrator removes the MFA binding of a member of R (native RemoveBindMFA), **when** the member next makes a request, **then** the member must configure a provider again before continuing, and the removal is audited (AUD-IAM-004). Basis: REQ-MPC-FR-021; FIT |

**Use case US-IAM-004-02**

| Attribute | Description |
|---|---|
| User Story | As a member of staff, I want to use an authenticator app, an email code, an SMS code or a hardware security key as my second check, so that I can use what I have. |
| Use Case ID | US-IAM-004-02 |
| Use Case Name | To use an authenticator app, an email code, an SMS code or a hardware security key as my second check |
| Actor(s) | • Member of staff<br>• Platform (IAM plugin) |
| Preconditions | • The email-code provider is active. |
| Trigger | A user who selected it passes the password step. |
| Basic Flow | 1. Trigger: a user who selected it passes the password step.<br>2. The system responds: a code is sent to the account email and the login completes only with the correct code within its validity (AC-IAM-004-02-01).<br>3. A user who selected it passes the password step: a code is sent through IC-IAM-01 to the verified mobile number and the login completes only with the correct code (AC-IAM-004-02-02).<br>4. The user passes the password step: the login completes only after a valid key assertion for that user (AC-IAM-004-02-03).<br>5. A user selects it: time-based codes from an authenticator app are accepted as the second check (AC-IAM-004-02-04). |
| Alternate Flows | Not stated in source |
| Exception Flow | Not stated in source |
| Postconditions | • Time-based codes from an authenticator app are accepted as the second check (AC-IAM-004-02-04). |
| Business Rules | • BR-IAM-030 — MFA by role: the setting "MFA-required roles" lists role system names<br>• BR-IAM-031 — Second factors are IMultiFactorAuthenticationMethod plugins following the bundled GoogleAuthenticator pattern: the verification component posts to the plugin controller, which reads CustomerMultiFactorAuthenticationInfo from the session and calls SignInCustomerAsync only after a successful check |
| Notes | • Contracts: IC-IAM-01<br>• Story basis: D; FC-M10-002 |
| Readiness | Ready |
| Acceptance Criteria | **AC-IAM-004-02-01** — **Given** the email-code provider is active, **when** a user who selected it passes the password step, **then** a code is sent to the account email and the login completes only with the correct code within its validity. Basis: D; FC-M10-002<br>**AC-IAM-004-02-02** — **Given** the SMS-code provider is active, **when** a user who selected it passes the password step, **then** a code is sent through IC-IAM-01 to the verified mobile number and the login completes only with the correct code. Basis: D; FC-M10-002<br>**AC-IAM-004-02-03** — **Given** the hardware-key (FIDO2 / WebAuthn) provider is active and the user registered a key, **when** the user passes the password step, **then** the login completes only after a valid key assertion for that user. Basis: D; FC-M10-002<br>**AC-IAM-004-02-04** — **Given** the bundled MultiFactorAuth.GoogleAuthenticator plugin is active, **when** a user selects it, **then** time-based codes from an authenticator app are accepted as the second check. Basis: FIT |

**Use case US-IAM-004-03**

| Attribute | Description |
|---|---|
| User Story | As a buyer, I want to switch on a second login check for my own account and choose the factor, so that my account is better protected. |
| Use Case ID | US-IAM-004-03 |
| Use Case Name | To switch on a second login check for my own account and choose the factor |
| Actor(s) | • Buyer<br>• Platform (IAM plugin) |
| Preconditions | • The buyer holds Security.EnableMultiFactorAuthentication (native default for Registered). |
| Trigger | The buyer opens the MFA page in My account and selects one of the active providers. |
| Basic Flow | 1. Trigger: the buyer opens the MFA page in My account and selects one of the active providers.<br>2. The system responds: later logins of that buyer require the selected factor (AC-IAM-004-03-01).<br>3. The buyer switches MFA off: it is switched off; a member of an MFA-required role cannot switch it off (AC-IAM-004-03-02). |
| Alternate Flows | Not stated in source |
| Exception Flow | Not stated in source |
| Postconditions | • It is switched off; a member of an MFA-required role cannot switch it off (AC-IAM-004-03-02). |
| Business Rules | • BR-IAM-030 — MFA by role: the setting "MFA-required roles" lists role system names<br>• BR-IAM-031 — Second factors are IMultiFactorAuthenticationMethod plugins following the bundled GoogleAuthenticator pattern: the verification component posts to the plugin controller, which reads CustomerMultiFactorAuthenticationInfo from the session and calls SignInCustomerAsync only after a successful check |
| Notes | • Permissions: Security.EnableMultiFactorAuthentication<br>• Story basis: D; REQ-MPC-FR-002 |
| Readiness | Ready |
| Acceptance Criteria | **AC-IAM-004-03-01** — **Given** the buyer holds Security.EnableMultiFactorAuthentication (native default for Registered), **when** the buyer opens the MFA page in My account and selects one of the active providers, **then** later logins of that buyer require the selected factor. Basis: REQ-MPC-FR-002; FIT<br>**AC-IAM-004-03-02** — **Given** a buyer is not in an MFA-required role, **when** the buyer switches MFA off, **then** it is switched off; a member of an MFA-required role cannot switch it off. Basis: Proposed |

**Business rules applied:** BR-IAM-030; BR-IAM-031 (§8.1).


### 7.5 PRD-IAM-005 Single sign-on for staff and B2B buyers

| Item | Value |
|---|---|
| Description (baseline) | Staff and business buyers can log in with the account they already use at work (for example Microsoft or Google) instead of a separate password. Accounts are created and disabled automatically when a person joins or leaves the organisation. |
| Why it matters | Fewer passwords, and the client's IT team controls access centrally. |
| Who benefits | Client staff; business buyers |
| Phase | P2 |
| Implementation | Code-level — Custom plugin |
| Depends on | — |
| Status | Ready |

**Use case US-IAM-005-01**

| Attribute | Description |
|---|---|
| User Story | As a member of staff, I want to log in with the work account I already use, so that I need no separate password. |
| Use Case ID | US-IAM-005-01 |
| Use Case Name | To log in with the work account I already use |
| Actor(s) | • Member of staff<br>• Platform (IAM plugin) |
| Preconditions | • An OpenID Connect or SAML 2.0 provider plugin (IExternalAuthenticationMethod with IExternalAuthenticationRegistrar) is active. |
| Trigger | A member of staff signs in at the provider. |
| Basic Flow | 1. Trigger: a member of staff signs in at the provider.<br>2. The system responds: the user is matched to the existing customer through ExternalAuthenticationRecord or verified email and signed in; staff accounts are not created by sign-in alone (Proposed) (AC-IAM-005-01-01). |
| Alternate Flows | • The user is in an MFA-required role (IAM-004): when the user signs in through the provider, the sign-in is accepted only if the provider asserts a multi-factor authentication method; otherwise the IAM second factor is requested (AC-IAM-005-01-03). |
| Exception Flow | • The provider returns an error: when the callback is processed, the native external-authentication error flow runs and the error is logged when ExternalAuthenticationSettings.LogErrors is on (AC-IAM-005-01-02). |
| Postconditions | • The user is matched to the existing customer through ExternalAuthenticationRecord or verified email and signed in; staff accounts are not created by sign-in alone (Proposed) (AC-IAM-005-01-01). |
| Business Rules | • BR-IAM-030 — MFA by role: the setting "MFA-required roles" lists role system names<br>• BR-IAM-140 — Key catalogue: every new IAM setting key is listed in the IAM plugin key catalogue with key, type, layer, secret flag and default (NFR-X-008)<br>• BR-IAM-141 — Feature state: IAM features that are not always on (IAM-005, IAM-009, IAM-013, IAM-022, IAM-023, IAM-025, IAM-026, IAM-027) check IC-PLT-02 IsEnabled for the store before showing pages or widgets, running filters or scheduled work |
| Notes | • Story basis: D; FC-M10-003 |
| Readiness | Ready |
| Acceptance Criteria | **AC-IAM-005-01-01** — **Given** an OpenID Connect or SAML 2.0 provider plugin (IExternalAuthenticationMethod with IExternalAuthenticationRegistrar) is active, **when** a member of staff signs in at the provider, **then** the user is matched to the existing customer through ExternalAuthenticationRecord or verified email and signed in; staff accounts are not created by sign-in alone (Proposed). Basis: D; FIT; FC-M10-003<br>**AC-IAM-005-01-02** — **Given** the provider returns an error, **when** the callback is processed, **then** the native external-authentication error flow runs and the error is logged when ExternalAuthenticationSettings.LogErrors is on. Basis: FIT<br>**AC-IAM-005-01-03** — **Given** the user is in an MFA-required role (IAM-004), **when** the user signs in through the provider, **then** the sign-in is accepted only if the provider asserts a multi-factor authentication method; otherwise the IAM second factor is requested. Basis: Proposed |

**Use case US-IAM-005-02**

| Attribute | Description |
|---|---|
| User Story | As a client IT administrator, I want accounts to be created and disabled automatically when people join or leave, so that access follows our directory. |
| Use Case ID | US-IAM-005-02 |
| Use Case Name | Accounts to be created and disabled automatically when people join or leave |
| Actor(s) | • Client IT administrator<br>• Platform (IAM plugin) |
| Preconditions | • A provisioning message "deactivate user" arrives from the identity provider. |
| Trigger | It is processed. |
| Basic Flow | 1. Trigger: it is processed.<br>2. The system responds: the customer is set inactive and RequireReLogin is set, so open sessions end (AUD-IAM-008) (AC-IAM-005-02-01).<br>3. It is processed: the customer is created with the roles mapped from the groups (mapping is configuration) (AC-IAM-005-02-02). |
| Alternate Flows | Not stated in source |
| Exception Flow | Not stated in source |
| Postconditions | • The customer is created with the roles mapped from the groups (mapping is configuration) (AC-IAM-005-02-02). |
| Business Rules | • BR-IAM-030 — MFA by role: the setting "MFA-required roles" lists role system names<br>• BR-IAM-140 — Key catalogue: every new IAM setting key is listed in the IAM plugin key catalogue with key, type, layer, secret flag and default (NFR-X-008)<br>• BR-IAM-141 — Feature state: IAM features that are not always on (IAM-005, IAM-009, IAM-013, IAM-022, IAM-023, IAM-025, IAM-026, IAM-027) check IC-PLT-02 IsEnabled for the store before showing pages or widgets, running filters or scheduled work |
| Notes | • Audit events: AUD-IAM-008<br>• Story basis: D; FC-M23-008 |
| Readiness | Ready |
| Acceptance Criteria | **AC-IAM-005-02-01** — **Given** a provisioning message "deactivate user" arrives from the identity provider, **when** it is processed, **then** the customer is set inactive and RequireReLogin is set, so open sessions end (AUD-IAM-008). Basis: D; FIT (CookieAuthenticationService rejects inactive customers)<br>**AC-IAM-005-02-02** — **Given** a provisioning message "create user" with group membership arrives, **when** it is processed, **then** the customer is created with the roles mapped from the groups (mapping is configuration). Basis: D; FC-M23-008 |

**Use case US-IAM-005-03**

| Attribute | Description |
|---|---|
| User Story | As a business buyer, I want to log in with my company identity provider, so that my company controls my access. |
| Use Case ID | US-IAM-005-03 |
| Use Case Name | To log in with my company identity provider |
| Actor(s) | • Business buyer<br>• Platform (IAM plugin) |
| Preconditions | • A company account (IAM-022) has its own provider configured. |
| Trigger | A member signs in through it. |
| Basic Flow | 1. Trigger: a member signs in through it.<br>2. The system responds: the member is signed in and linked to that company (AC-IAM-005-03-01). |
| Alternate Flows | Not stated in source |
| Exception Flow | Not stated in source |
| Postconditions | • The member is signed in and linked to that company (AC-IAM-005-03-01). |
| Business Rules | • BR-IAM-030 — MFA by role: the setting "MFA-required roles" lists role system names<br>• BR-IAM-140 — Key catalogue: every new IAM setting key is listed in the IAM plugin key catalogue with key, type, layer, secret flag and default (NFR-X-008)<br>• BR-IAM-141 — Feature state: IAM features that are not always on (IAM-005, IAM-009, IAM-013, IAM-022, IAM-023, IAM-025, IAM-026, IAM-027) check IC-PLT-02 IsEnabled for the store before showing pages or widgets, running filters or scheduled work |
| Notes | • Story basis: D |
| Readiness | Ready |
| Acceptance Criteria | **AC-IAM-005-03-01** — **Given** a company account (IAM-022) has its own provider configured, **when** a member signs in through it, **then** the member is signed in and linked to that company. Basis: D; Proposed |

**Business rules applied:** BR-IAM-030; BR-IAM-140; BR-IAM-141 (§8.1).


### 7.6 PRD-IAM-006 Session management

| Item | Value |
|---|---|
| Description (baseline) | Automatic logout after inactivity, limits on logging in from many places at once, and the ability to force someone off the system. |
| Why it matters | Reduces the risk of someone using an unattended or stolen session. |
| Who benefits | All users |
| Phase | P1 |
| Implementation | Code-level — Custom plugin |
| Depends on | — |
| Status | Ready |

**Use case US-IAM-006-01**

| Attribute | Description |
|---|---|
| User Story | As a client administrator, I want users to be logged out after a configured time without activity, so that an unattended session cannot be used by someone else. |
| Use Case ID | US-IAM-006-01 |
| Use Case Name | Users to be logged out after a configured time without activity |
| Actor(s) | • Client administrator<br>• Platform (IAM plugin) |
| Preconditions | • An idle timeout is set for the user class (staff or buyer). |
| Trigger | No request arrives in a session for that time. |
| Basic Flow | 1. Trigger: no request arrives in a session for that time.<br>2. The system responds: the next request is treated as signed out, the session record becomes Expired and the login page shows message Iam.SessionExpired (AC-IAM-006-01-01).<br>3. The user keeps making requests: the session stays valid and its last-activity time moves forward with each request (AC-IAM-006-01-02).<br>4. The idle timeout passes: the session still ends, because the check is made on the server session record, not on the cookie lifetime (BR-IAM-040) (AC-IAM-006-01-03). |
| Alternate Flows | Not stated in source |
| Exception Flow | Not stated in source |
| Postconditions | • The next request is treated as signed out, the session record becomes Expired and the login page shows message Iam.SessionExpired (AC-IAM-006-01-01). |
| Business Rules | • BR-IAM-040 — Sessions: every sign-in creates a UserSession record (session id claim, customer, created, last activity, IP address, user agent) |
| Notes | • Messages and templates: Iam.SessionExpired<br>• Story basis: D; REQ-MPC-FR-013 |
| Readiness | Ready |
| Acceptance Criteria | **AC-IAM-006-01-01** — **Given** an idle timeout is set for the user class (staff or buyer), **when** no request arrives in a session for that time, **then** the next request is treated as signed out, the session record becomes Expired and the login page shows message Iam.SessionExpired. Basis: REQ-MPC-FR-013; FIT (the native auth cookie has no configurable idle timeout)<br>**AC-IAM-006-01-02** — **Given** an idle timeout is set, **when** the user keeps making requests, **then** the session stays valid and its last-activity time moves forward with each request. Basis: REQ-MPC-FR-013<br>**AC-IAM-006-01-03** — **Given** the user ticked "remember me" (native persistent cookie), **when** the idle timeout passes, **then** the session still ends, because the check is made on the server session record, not on the cookie lifetime (BR-IAM-040). Basis: REQ-MPC-FR-013; Proposed |

**Use case US-IAM-006-02**

| Attribute | Description |
|---|---|
| User Story | As a client administrator, I want to limit how many sessions one user can have at once, so that a shared or stolen password is less useful. |
| Use Case ID | US-IAM-006-02 |
| Use Case Name | To limit how many sessions one user can have at once |
| Actor(s) | • Client administrator<br>• Platform (IAM plugin) |
| Preconditions | • A concurrent-session limit is set and the user already has that many sessions. |
| Trigger | The user signs in again. |
| Basic Flow | 1. Trigger: the user signs in again.<br>2. The system responds: the oldest session is revoked, or the new login is refused with message Iam.SessionLimitReached, as the setting says (AC-IAM-006-02-01). |
| Alternate Flows | Not stated in source |
| Exception Flow | Not stated in source |
| Postconditions | • The oldest session is revoked, or the new login is refused with message Iam.SessionLimitReached, as the setting says (AC-IAM-006-02-01). |
| Business Rules | • BR-IAM-040 — Sessions: every sign-in creates a UserSession record (session id claim, customer, created, last activity, IP address, user agent)<br>• BR-IAM-011 — Mobile identity: login by mobile number and code is native in nopCommerce 5.00 (OtpSettings.LoginByPhoneEnabled, ValidateCustomerByPhoneAsync) and is not rebuilt |
| Notes | • Messages and templates: Iam.SessionLimitReached<br>• Story basis: D; FC-M10-006 |
| Readiness | Ready |
| Acceptance Criteria | **AC-IAM-006-02-01** — **Given** a concurrent-session limit is set and the user already has that many sessions, **when** the user signs in again, **then** the oldest session is revoked, or the new login is refused with message Iam.SessionLimitReached, as the setting says. Basis: FC-M10-006; Proposed |

**Use case US-IAM-006-03**

| Attribute | Description |
|---|---|
| User Story | As a security officer, I want to force a user off the system at once, so that I can stop misuse immediately. |
| Use Case ID | US-IAM-006-03 |
| Use Case Name | To force a user off the system at once |
| Actor(s) | • Security officer<br>• Platform (IAM plugin) |
| Preconditions | • The officer ends one session of U. |
| Trigger | The action is confirmed. |
| Basic Flow | 1. Trigger: the action is confirmed.<br>2. The system responds: only that session is revoked; other sessions of U continue (AC-IAM-006-03-02). |
| Alternate Flows | Not stated in source |
| Exception Flow | • The security officer holds Identity.Core.Sessions.CreateEditDelete: when the officer forces user U off, all session records of U are revoked, Customer.RequireReLogin is set so every open cookie of U is rejected, and AUD-IAM-005 is written (AC-IAM-006-03-01). |
| Postconditions | • Only that session is revoked; other sessions of U continue (AC-IAM-006-03-02). |
| Business Rules | • BR-IAM-040 — Sessions: every sign-in creates a UserSession record (session id claim, customer, created, last activity, IP address, user agent)<br>• BR-IAM-011 — Mobile identity: login by mobile number and code is native in nopCommerce 5.00 (OtpSettings.LoginByPhoneEnabled, ValidateCustomerByPhoneAsync) and is not rebuilt |
| Notes | • Messages and templates: Customer.RequireReLogin<br>• Permissions: Identity.Core.Sessions.CreateEditDelete<br>• Audit events: AUD-IAM-005<br>• Story basis: D |
| Readiness | Ready |
| Acceptance Criteria | **AC-IAM-006-03-01** — **Given** the security officer holds Identity.Core.Sessions.CreateEditDelete, **when** the officer forces user U off, **then** all session records of U are revoked, Customer.RequireReLogin is set so every open cookie of U is rejected, and AUD-IAM-005 is written. Basis: D; FIT (CookieAuthenticationService checks RequireReLogin)<br>**AC-IAM-006-03-02** — **Given** the officer ends one session of U, **when** the action is confirmed, **then** only that session is revoked; other sessions of U continue. Basis: Proposed |

**Use case US-IAM-006-04**

| Attribute | Description |
|---|---|
| User Story | As a registered customer or staff user, I want my session to be renewed after a sensitive change, so that an old session cannot be reused. |
| Use Case ID | US-IAM-006-04 |
| Use Case Name | My session to be renewed after a sensitive change |
| Actor(s) | • Registered customer or staff user<br>• Platform (IAM plugin) |
| Preconditions | • A user changes password, MFA settings or is given a new role. |
| Trigger | The change is saved. |
| Basic Flow | 1. Trigger: the change is saved.<br>2. The system responds: the user is signed in again with a new session identifier and the old session record is revoked (AC-IAM-006-04-01). |
| Alternate Flows | Not stated in source |
| Exception Flow | Not stated in source |
| Postconditions | • The user is signed in again with a new session identifier and the old session record is revoked (AC-IAM-006-04-01). |
| Business Rules | • BR-IAM-040 — Sessions: every sign-in creates a UserSession record (session id claim, customer, created, last activity, IP address, user agent)<br>• BR-IAM-011 — Mobile identity: login by mobile number and code is native in nopCommerce 5.00 (OtpSettings.LoginByPhoneEnabled, ValidateCustomerByPhoneAsync) and is not rebuilt |
| Notes | • Story basis: FC-M10-006 |
| Readiness | Ready |
| Acceptance Criteria | **AC-IAM-006-04-01** — **Given** a user changes password, MFA settings or is given a new role, **when** the change is saved, **then** the user is signed in again with a new session identifier and the old session record is revoked. Basis: FC-M10-006; FIT (RequiredReLoginAfterPasswordChange) |

**Business rules applied:** BR-IAM-040; BR-IAM-011 (§8.1).


### 7.7 PRD-IAM-007 Roles and permissions

| Item | Value |
|---|---|
| Description (baseline) | Defines what each type of user (customer, seller, staff, administrator) can see and do, including custom roles and which products each group can see. |
| Why it matters | People only see and do what their job needs. |
| Who benefits | Client administrators |
| Phase | P1 |
| Implementation | Configuration — None |
| Depends on | — |
| Status | Ready |

**Use case US-IAM-007-01**

| Attribute | Description |
|---|---|
| User Story | As a client administrator, I want to create my own roles and give them permissions, so that roles match our organisation without code. |
| Use Case ID | US-IAM-007-01 |
| Use Case Name | To create my own roles and give them permissions |
| Actor(s) | • Client administrator<br>• Platform (IAM plugin) |
| Preconditions | • A user holds Customers.CustomerRolesCreateEditDelete and Configuration.ManageACL. |
| Trigger | The user creates a role with a name and system name and ticks permissions for it in the native permission pages (SecurityController.PermissionEditPopup). |
| Basic Flow | 1. Trigger: the user creates a role with a name and system name and ticks permissions for it in the native permission pages (SecurityController.PermissionEditPopup).<br>2. The system responds: members of the new role get exactly those permissions and no others (AC-IAM-007-01-01). |
| Alternate Flows | Not stated in source |
| Exception Flow | • A user holds Customers.CustomerRolesCreateEditDelete but not Configuration.ManageACL: when the user saves a role or a permission mapping, the save is denied by the native CheckPermission filter and nothing changes (AC-IAM-007-01-02). |
| Postconditions | • Members of the new role get exactly those permissions and no others (AC-IAM-007-01-01). |
| Business Rules | • BR-IAM-050 — Product role catalogue (role system names, Proposed<br>• BR-IAM-051 — Effective permissions are the union of the permissions of all roles of the user, plus active delegations (IAM-009), limited by the user scopes (IAM-008)<br>• BR-IAM-052 — Role and permission packs use 5.00 permission system names (news, polls and forums permissions are the plugin names News.*, Polls.*, Forums.*)<br>• BR-IAM-053 — Role packs: native permissions that a module gives to a product role are declared in that module chapter and mapped by the role pack (PLT-003, IC-PLT-01 Apply through IPermissionService.InsertPermissionMappingAsync)<br>• BR-IAM-054 — Permission exclusions declared by modules are checked when a pack is validated (IC-PLT-01) and when a mapping is saved in SecurityController.PermissionEditPopup [POST] (IAM action filter): Vendors never hold Orders.ReturnRequestsView or Orders.ReturnRequestsCreateEditDelete (RET) |
| Notes | • Permissions: Customers.CustomerRolesCreateEditDelete, Configuration.ManageACL<br>• Story basis: D; REQ-MPC-FR-302 |
| Readiness | Ready |
| Acceptance Criteria | **AC-IAM-007-01-01** — **Given** a user holds Customers.CustomerRolesCreateEditDelete and Configuration.ManageACL, **when** the user creates a role with a name and system name and ticks permissions for it in the native permission pages (SecurityController.PermissionEditPopup), **then** members of the new role get exactly those permissions and no others. Basis: REQ-MPC-FR-302; FIT (CustomerRoleController.Create [POST] and SecurityController.PermissionEditPopup [POST] require Configuration.ManageACL)<br>**AC-IAM-007-01-02** — **Given** a user holds Customers.CustomerRolesCreateEditDelete but not Configuration.ManageACL, **when** the user saves a role or a permission mapping, **then** the save is denied by the native CheckPermission filter and nothing changes. Basis: FIT (CustomerRoleController; SecurityController) |

**Use case US-IAM-007-02**

| Attribute | Description |
|---|---|
| User Story | As a client administrator, I want administrative and operational users to have access by role only, so that people see and do only what their job needs. |
| Use Case ID | US-IAM-007-02 |
| Use Case Name | Administrative and operational users to have access by role only |
| Actor(s) | • Client administrator<br>• Platform (IAM plugin) |
| Preconditions | • A user whose roles do not include Orders.OrdersView. |
| Trigger | The user opens the admin order list. |
| Basic Flow | 1. Trigger: the user opens the admin order list.<br>2. The system responds: access is denied by the native CheckPermission filter (AC-IAM-007-02-01). |
| Alternate Flows | Not stated in source |
| Exception Flow | • A role holds only view permissions for an area (5.00 view / create-edit-delete split, unchanged from 4.90): when a member tries to save a change in that area, the save is denied and nothing changes (AC-IAM-007-02-02). |
| Postconditions | • Access is denied by the native CheckPermission filter (AC-IAM-007-02-01). |
| Business Rules | • BR-IAM-050 — Product role catalogue (role system names, Proposed<br>• BR-IAM-051 — Effective permissions are the union of the permissions of all roles of the user, plus active delegations (IAM-009), limited by the user scopes (IAM-008)<br>• BR-IAM-052 — Role and permission packs use 5.00 permission system names (news, polls and forums permissions are the plugin names News.*, Polls.*, Forums.*)<br>• BR-IAM-053 — Role packs: native permissions that a module gives to a product role are declared in that module chapter and mapped by the role pack (PLT-003, IC-PLT-01 Apply through IPermissionService.InsertPermissionMappingAsync)<br>• BR-IAM-054 — Permission exclusions declared by modules are checked when a pack is validated (IC-PLT-01) and when a mapping is saved in SecurityController.PermissionEditPopup [POST] (IAM action filter): Vendors never hold Orders.ReturnRequestsView or Orders.ReturnRequestsCreateEditDelete (RET) |
| Notes | • Story basis: D; REQ-MPC-FR-011 |
| Readiness | Ready |
| Acceptance Criteria | **AC-IAM-007-02-01** — **Given** a user whose roles do not include Orders.OrdersView, **when** the user opens the admin order list, **then** access is denied by the native CheckPermission filter. Basis: REQ-MPC-FR-011; FIT<br>**AC-IAM-007-02-02** — **Given** a role holds only view permissions for an area (5.00 view / create-edit-delete split, unchanged from 4.90), **when** a member tries to save a change in that area, **then** the save is denied and nothing changes. Basis: REQ-MPC-FR-011; FIT (StandardPermission *View / *CreateEditDelete) |

**Use case US-IAM-007-03**

| Attribute | Description |
|---|---|
| User Story | As a client administrator, I want to limit which products, categories, manufacturers, topics and menus each role can see, so that restricted items stay with the right buyers. |
| Use Case ID | US-IAM-007-03 |
| Use Case Name | To limit which products, categories, manufacturers, topics and menus each role can see |
| Actor(s) | • Client administrator<br>• Platform (IAM plugin) |
| Preconditions | • A product has SubjectToAcl on and only role R is allowed. |
| Trigger | A customer outside R browses or searches. |
| Basic Flow | 1. Trigger: a customer outside R browses or searches.<br>2. The system responds: the product is not shown (AC-IAM-007-03-01). |
| Alternate Flows | Not stated in source |
| Exception Flow | Not stated in source |
| Postconditions | • The product is not shown (AC-IAM-007-03-01). |
| Business Rules | • BR-IAM-050 — Product role catalogue (role system names, Proposed<br>• BR-IAM-051 — Effective permissions are the union of the permissions of all roles of the user, plus active delegations (IAM-009), limited by the user scopes (IAM-008)<br>• BR-IAM-052 — Role and permission packs use 5.00 permission system names (news, polls and forums permissions are the plugin names News.*, Polls.*, Forums.*)<br>• BR-IAM-053 — Role packs: native permissions that a module gives to a product role are declared in that module chapter and mapped by the role pack (PLT-003, IC-PLT-01 Apply through IPermissionService.InsertPermissionMappingAsync)<br>• BR-IAM-054 — Permission exclusions declared by modules are checked when a pack is validated (IC-PLT-01) and when a mapping is saved in SecurityController.PermissionEditPopup [POST] (IAM action filter): Vendors never hold Orders.ReturnRequestsView or Orders.ReturnRequestsCreateEditDelete (RET) |
| Notes | • Story basis: D; FIT |
| Readiness | Ready |
| Acceptance Criteria | **AC-IAM-007-03-01** — **Given** a product has SubjectToAcl on and only role R is allowed, **when** a customer outside R browses or searches, **then** the product is not shown. Basis: FIT (IAclSupported: Product, Category, Manufacturer, Topic, Menu, MenuItem) |

**Use case US-IAM-007-04**

| Attribute | Description |
|---|---|
| User Story | As a client administrator, I want the roles that product modules rely on (for example Finance, Risk, Agent) to exist with fixed names, so that module permissions work after installation without manual set-up. |
| Use Case ID | US-IAM-007-04 |
| Use Case Name | The roles that product modules rely on (for example Finance, Risk, Agent) to exist with fixed names |
| Actor(s) | • Client administrator<br>• Platform (IAM plugin)<br>• PLT-003 (Configuration packs) |
| Preconditions | • The product plugins are installed. |
| Trigger | The application starts. |
| Basic Flow | 1. Trigger: the application starts.<br>2. The system responds: every role of BR-IAM-050 exists with exactly its system name and is listed in the admin role list, including roles that hold only native permissions and roles deleted before (the IAM plugin creates them; PermissionService creates a role only when it installs a new permission) (AC-IAM-007-04-01).<br>3. The role is saved: the system name is unchanged and the permissions of the modules still apply (AC-IAM-007-04-02).<br>4. The role pack is applied (PLT-003, IC-PLT-01): the native permission is mapped to that role; the native default mappings of other roles are unchanged (BR-IAM-053) (AC-IAM-007-04-04). |
| Alternate Flows | Not stated in source |
| Exception Flow | • A role of BR-IAM-050 is not a native system role (IsSystemRole false, so native code allows changing its system name or deleting it): when an administrator changes its system name or deletes it, the IAM action filter on Admin CustomerRoleController.Edit and Delete [POST] refuses the change with message Iam.ProductRoleProtected and nothing changes (AC-IAM-007-04-03).<br>• An exclusion of BR-IAM-054 exists (for example Vendors never hold Orders.ReturnRequestsView): when a pack or an administrator in SecurityController.PermissionEditPopup maps the excluded permission to that role, the pack fails validation, or the IAM action filter refuses the save with message Iam.PermissionExcluded; nothing changes (AC-IAM-007-04-05).<br>• A role pack lists permission system names: when the pack is applied (PLT-003), every name must exist as a 5.00 permission; an unknown name, for example the 4.70 name ManageProducts or a 4.90 name removed in 5.00 such as ContentManagement.NewsView, is reported as an error and grants nothing (BR-IAM-052) (AC-IAM-007-04-06). |
| Postconditions | • Every role of BR-IAM-050 exists with exactly its system name and is listed in the admin role list, including roles that hold only native permissions and roles deleted before (the IAM plugin creates them; PermissionService creates a role only when it installs a new permission) (AC-IAM-007-04-01). |
| Business Rules | • BR-IAM-050 — Product role catalogue (role system names, Proposed<br>• BR-IAM-053 — Role packs: native permissions that a module gives to a product role are declared in that module chapter and mapped by the role pack (PLT-003, IC-PLT-01 Apply through IPermissionService.InsertPermissionMappingAsync)<br>• BR-IAM-054 — Permission exclusions declared by modules are checked when a pack is validated (IC-PLT-01) and when a mapping is saved in SecurityController.PermissionEditPopup [POST] (IAM action filter): Vendors never hold Orders.ReturnRequestsView or Orders.ReturnRequestsCreateEditDelete (RET)<br>• BR-IAM-052 — Role and permission packs use 5.00 permission system names (news, polls and forums permissions are the plugin names News.*, Polls.*, Forums.*) |
| Notes | • Messages and templates: Iam.PermissionExcluded, Iam.ProductRoleProtected<br>• Contracts: IC-PLT-01<br>• Story basis: Proposed |
| Readiness | Ready |
| Acceptance Criteria | **AC-IAM-007-04-01** — **Given** the product plugins are installed, **when** the application starts, **then** every role of BR-IAM-050 exists with exactly its system name and is listed in the admin role list, including roles that hold only native permissions and roles deleted before (the IAM plugin creates them; PermissionService creates a role only when it installs a new permission). Basis: Proposed; FIT (PermissionService.InsertPermissionsAsync, InstallPermissionsAsync; AppStartedConsumer)<br>**AC-IAM-007-04-02** — **Given** an administrator changes the display name of a product role, **when** the role is saved, **then** the system name is unchanged and the permissions of the modules still apply. Basis: Proposed<br>**AC-IAM-007-04-03** — **Given** a role of BR-IAM-050 is not a native system role (IsSystemRole false, so native code allows changing its system name or deleting it), **when** an administrator changes its system name or deletes it, **then** the IAM action filter on Admin CustomerRoleController.Edit and Delete [POST] refuses the change with message Iam.ProductRoleProtected and nothing changes. Basis: Proposed; FIT (CustomerRoleController.Edit checks the system name only for IsSystemRole)<br>**AC-IAM-007-04-04** — **Given** a module chapter declares native permissions for one of its product roles (for example EGV: Orders.OrdersView to AgencyOfficer), **when** the role pack is applied (PLT-003, IC-PLT-01), **then** the native permission is mapped to that role; the native default mappings of other roles are unchanged (BR-IAM-053). Basis: Proposed<br>**AC-IAM-007-04-05** — **Given** an exclusion of BR-IAM-054 exists (for example Vendors never hold Orders.ReturnRequestsView), **when** a pack or an administrator in SecurityController.PermissionEditPopup maps the excluded permission to that role, **then** the pack fails validation, or the IAM action filter refuses the save with message Iam.PermissionExcluded; nothing changes. Basis: Proposed<br>**AC-IAM-007-04-06** — **Given** a role pack lists permission system names, **when** the pack is applied (PLT-003), **then** every name must exist as a 5.00 permission; an unknown name, for example the 4.70 name ManageProducts or a 4.90 name removed in 5.00 such as ContentManagement.NewsView, is reported as an error and grants nothing (BR-IAM-052). Basis: FIT (L1 §6.5) |

**Use case US-IAM-007-05**

| Attribute | Description |
|---|---|
| User Story | As a KTDA administrator, I want several roles per user and one role per stakeholder group, so that KTDA user groups and stakeholders can be modelled when they are confirmed. |
| Use Case ID | US-IAM-007-05 |
| Use Case Name | Several roles per user and one role per stakeholder group |
| Actor(s) | • KTDA administrator<br>• Platform (IAM plugin) |
| Preconditions | • A user holds roles A and B. |
| Trigger | The user opens a function permitted to B only. |
| Basic Flow | 1. Trigger: the user opens a function permitted to B only.<br>2. The system responds: access is granted: effective permissions are the union of the roles (BR-IAM-051) (AC-IAM-007-05-01).<br>3. An administrator creates one role per type with its permission set: each stakeholder user gets the access of its type (AC-IAM-007-05-02). |
| Alternate Flows | Not stated in source |
| Exception Flow | Not stated in source |
| Postconditions | • Each stakeholder user gets the access of its type (AC-IAM-007-05-02). |
| Business Rules | • BR-IAM-051 — Effective permissions are the union of the permissions of all roles of the user, plus active delegations (IAM-009), limited by the user scopes (IAM-008) |
| Notes | • Story basis: REQ-KTDA-PRJ-001; Inference from REQ-KTDA-CUS-001 (stakeholder types undefined, KG-16) |
| Readiness | Ready |
| Acceptance Criteria | **AC-IAM-007-05-01** — **Given** a user holds roles A and B, **when** the user opens a function permitted to B only, **then** access is granted: effective permissions are the union of the roles (BR-IAM-051). Basis: REQ-KTDA-PRJ-001; FIT<br>**AC-IAM-007-05-02** — **Given** KTDA has confirmed its stakeholder types (KG-16), **when** an administrator creates one role per type with its permission set, **then** each stakeholder user gets the access of its type. Basis: Inference from REQ-KTDA-CUS-001 (stakeholder types undefined, KG-16) |

**Business rules applied:** BR-IAM-050; BR-IAM-051; BR-IAM-052; BR-IAM-053; BR-IAM-054 (§8.1).


### 7.8 PRD-IAM-008 Scoped permissions

| Item | Value |
|---|---|
| Description (baseline) | Limits a person's permissions to a part of the business, for example one store, one region, one category or orders up to a certain value. |
| Why it matters | Large organisations with branches or factories can delegate safely. |
| Who benefits | Client administrators |
| Phase | P1 |
| Implementation | Code-level — Custom plugin + Core modification |
| Depends on | — |
| Status | Ready |

**Use case US-IAM-008-01**

| Attribute | Description |
|---|---|
| User Story | As a client administrator, I want to limit a person's permissions to one store, region, category, value band or time window, so that branches can work independently and safely. |
| Use Case ID | US-IAM-008-01 |
| Use Case Name | To limit a person's permissions to one store, region, category, value band or time window |
| Actor(s) | • Client administrator<br>• Platform (IAM plugin)<br>• ADM-006 (Approval queues)<br>• CHK-013 (Assisted checkout) |
| Preconditions | • User U has a scope "store S" on Orders.OrdersView. |
| Trigger | U opens the admin order list. |
| Basic Flow | 1. Trigger: U opens the admin order list.<br>2. The system responds: only orders of store S are listed (admin query filtering, registered core modification L1 §6.3) (AC-IAM-008-01-01).<br>3. A opens the admin order list or the assisted orders list: only orders whose CHK-013 assisted-order record or pickup point is outlet O are listed (AC-IAM-008-01-06).<br>4. ADM-006 builds the approval queue of U: ADM-006 reads the limit and the active delegations of U through IC-IAM-06 and lists only items within the limit or delegated to U (BR-ADM-030) (AC-IAM-008-01-07). |
| Alternate Flows | Not stated in source |
| Exception Flow | • User U has a scope "store S": when U opens an order of another store by its address, access is denied with message Iam.ScopeDenied and the attempt is audited (AUD-IAM-006) (AC-IAM-008-01-02).<br>• User U has a value-band scope "up to value V" on an approval permission: when U approves an item above V, the approval is refused with message Iam.ScopeDenied (AC-IAM-008-01-03).<br>• User U has a category scope on product editing: when U edits a product outside the category, the save is refused and the product list shows only products in the category (AC-IAM-008-01-04).<br>• User U has a time-window scope: when U uses the permission outside the window, access is denied (AC-IAM-008-01-05). |
| Postconditions | • ADM-006 reads the limit and the active delegations of U through IC-IAM-06 and lists only items within the limit or delegated to U (BR-ADM-030) (AC-IAM-008-01-07). |
| Business Rules | • BR-IAM-060 — Scopes (dimension store, region, outlet, category, value band or time window<br>• BR-IAM-051 — Effective permissions are the union of the permissions of all roles of the user, plus active delegations (IAM-009), limited by the user scopes (IAM-008) |
| Notes | • Messages and templates: Iam.ScopeDenied<br>• Contracts: IC-IAM-06<br>• Audit events: AUD-IAM-006<br>• Story basis: D; FC-M10-009 |
| Readiness | Ready |
| Acceptance Criteria | **AC-IAM-008-01-01** — **Given** user U has a scope "store S" on Orders.OrdersView, **when** U opens the admin order list, **then** only orders of store S are listed (admin query filtering, registered core modification L1 §6.3). Basis: D; FIT (only vendor scoping is native: Customer.VendorId)<br>**AC-IAM-008-01-02** — **Given** user U has a scope "store S", **when** U opens an order of another store by its address, **then** access is denied with message Iam.ScopeDenied and the attempt is audited (AUD-IAM-006). Basis: Proposed<br>**AC-IAM-008-01-03** — **Given** user U has a value-band scope "up to value V" on an approval permission, **when** U approves an item above V, **then** the approval is refused with message Iam.ScopeDenied. Basis: FC-M10-009<br>**AC-IAM-008-01-04** — **Given** user U has a category scope on product editing, **when** U edits a product outside the category, **then** the save is refused and the product list shows only products in the category. Basis: FC-M10-009<br>**AC-IAM-008-01-05** — **Given** user U has a time-window scope, **when** U uses the permission outside the window, **then** access is denied. Basis: FC-M10-009<br>**AC-IAM-008-01-06** — **Given** agent A has the scope "outlet O" (from the IAM-026 outlet assignment) on Orders.OrdersView, **when** A opens the admin order list or the assisted orders list, **then** only orders whose CHK-013 assisted-order record or pickup point is outlet O are listed. Basis: Proposed<br>**AC-IAM-008-01-07** — **Given** user U has a value-band scope "up to value V" on an approval permission (the authority limit), **when** ADM-006 builds the approval queue of U, **then** ADM-006 reads the limit and the active delegations of U through IC-IAM-06 and lists only items within the limit or delegated to U (BR-ADM-030). Basis: FC-M10-009; Proposed |

**Use case US-IAM-008-02**

| Attribute | Description |
|---|---|
| User Story | As a KTDA administrator, I want to give factory or regional staff access to their own unit only, so that KTDA organisational units can work in one platform. |
| Use Case ID | US-IAM-008-02 |
| Use Case Name | To give factory or regional staff access to their own unit only |
| Actor(s) | • KTDA administrator<br>• Platform (IAM plugin) |
| Preconditions | • A region list is configured and records carry a region. |
| Trigger | User U has a scope "region R". |
| Basic Flow | 1. Trigger: user U has a scope "region R".<br>2. The system responds: U sees and changes only records of region R (AC-IAM-008-02-01). |
| Alternate Flows | Not stated in source |
| Exception Flow | Not stated in source |
| Postconditions | • U sees and changes only records of region R (AC-IAM-008-02-01). |
| Business Rules | • BR-IAM-060 — Scopes (dimension store, region, outlet, category, value band or time window<br>• BR-IAM-051 — Effective permissions are the union of the permissions of all roles of the user, plus active delegations (IAM-009), limited by the user scopes (IAM-008) |
| Notes | • Story basis: Inference from REQ-KTDA-PRJ-001 (organisational structures; units not stated, G-ORG) |
| Readiness | Ready |
| Acceptance Criteria | **AC-IAM-008-02-01** — **Given** a region list is configured and records carry a region, **when** user U has a scope "region R", **then** U sees and changes only records of region R. Basis: Inference from REQ-KTDA-PRJ-001 (region definition not stated, G-ORG) |

**Business rules applied:** BR-IAM-060; BR-IAM-051 (§8.1).


### 7.9 PRD-IAM-009 Permission delegation

| Item | Value |
|---|---|
| Description (baseline) | A manager can hand over approval rights to someone else for a fixed period (for example while on leave), with a record kept. |
| Why it matters | Work keeps moving when people are away, with accountability. |
| Who benefits | Approvers |
| Phase | P2 |
| Implementation | Code-level — Custom plugin |
| Depends on | — |
| Status | Ready |

**Use case US-IAM-009-01**

| Attribute | Description |
|---|---|
| User Story | As an approver, I want to hand over my approval rights to a colleague for a fixed period, so that work continues while I am away. |
| Use Case ID | US-IAM-009-01 |
| Use Case Name | To hand over my approval rights to a colleague for a fixed period |
| Actor(s) | • Approver<br>• Platform (IAM plugin)<br>• ADM-006 (Approval queues) |
| Preconditions | • Approver U delegated the approval permission of an ADM-006 queue to V for a period. |
| Trigger | V opens the approval queue inside the period. |
| Basic Flow | 1. Trigger: V opens the approval queue inside the period.<br>2. The system responds: ADM-006 lists the items of U for V, read through IC-IAM-06 GetApprovalAuthority, and V cannot decide an item that V requested (BR-ADM-030) (AC-IAM-009-01-05). |
| Alternate Flows | Not stated in source |
| Exception Flow | • User U holds permission P and P is marked delegable: when U delegates P to user V from a start date to an end date, between those dates the permission check for P succeeds for V (IAM IPermissionService override, BR-IAM-070), and outside them it fails (AC-IAM-009-01-01).<br>• U does not hold P, or P is not delegable: when U tries to delegate P, the delegation is refused with message Iam.DelegationNotAllowed (AC-IAM-009-01-02).<br>• The end date of a delegation passes: when V next uses P, access is denied without any manual step and the delegation becomes Ended (SM-IAM-08) (AC-IAM-009-01-03).<br>• V raised a request that needs approval: when V tries to approve it under a delegation, the approval is refused, because segregation of duties still applies (AC-IAM-009-01-04). |
| Postconditions | • ADM-006 lists the items of U for V, read through IC-IAM-06 GetApprovalAuthority, and V cannot decide an item that V requested (BR-ADM-030) (AC-IAM-009-01-05). |
| Business Rules | • BR-IAM-070 — Delegation: a user can delegate only a permission they hold and that is marked delegable |
| Notes | • Messages and templates: Iam.DelegationNotAllowed<br>• Contracts: IC-IAM-06<br>• State models: SM-IAM-08<br>• Story basis: D; FC-M04-020 |
| Readiness | Ready |
| Acceptance Criteria | **AC-IAM-009-01-01** — **Given** user U holds permission P and P is marked delegable, **when** U delegates P to user V from a start date to an end date, **then** between those dates the permission check for P succeeds for V (IAM IPermissionService override, BR-IAM-070), and outside them it fails. Basis: D; FC-M04-020<br>**AC-IAM-009-01-02** — **Given** U does not hold P, or P is not delegable, **when** U tries to delegate P, **then** the delegation is refused with message Iam.DelegationNotAllowed. Basis: Proposed<br>**AC-IAM-009-01-03** — **Given** the end date of a delegation passes, **when** V next uses P, **then** access is denied without any manual step and the delegation becomes Ended (SM-IAM-08). Basis: D<br>**AC-IAM-009-01-04** — **Given** V raised a request that needs approval, **when** V tries to approve it under a delegation, **then** the approval is refused, because segregation of duties still applies. Basis: Proposed<br>**AC-IAM-009-01-05** — **Given** approver U delegated the approval permission of an ADM-006 queue to V for a period, **when** V opens the approval queue inside the period, **then** ADM-006 lists the items of U for V, read through IC-IAM-06 GetApprovalAuthority, and V cannot decide an item that V requested (BR-ADM-030). Basis: D; FC-M04-020 |

**Use case US-IAM-009-02**

| Attribute | Description |
|---|---|
| User Story | As an auditor, I want a record of every delegation and of every action taken under it, so that accountability is kept. |
| Use Case ID | US-IAM-009-02 |
| Use Case Name | A record of every delegation and of every action taken under it |
| Actor(s) | • Auditor<br>• Platform (IAM plugin) |
| Preconditions | • V acts under a delegation. |
| Trigger | The action is saved. |
| Basic Flow | 1. Trigger: the action is saved.<br>2. The system responds: the audit record (AUD-IAM-007 for the delegation; the audit event of the action itself) names V as actor and U as the person on whose behalf V acted (AC-IAM-009-02-01).<br>3. The change happens: AUD-IAM-007 is written with delegator, delegate, permission and dates (AC-IAM-009-02-02). |
| Alternate Flows | Not stated in source |
| Exception Flow | Not stated in source |
| Postconditions | • AUD-IAM-007 is written with delegator, delegate, permission and dates (AC-IAM-009-02-02). |
| Business Rules | • BR-IAM-070 — Delegation: a user can delegate only a permission they hold and that is marked delegable |
| Notes | • Audit events: AUD-IAM-007<br>• Story basis: D; FC-M10-010 |
| Readiness | Ready |
| Acceptance Criteria | **AC-IAM-009-02-01** — **Given** V acts under a delegation, **when** the action is saved, **then** the audit record (AUD-IAM-007 for the delegation; the audit event of the action itself) names V as actor and U as the person on whose behalf V acted. Basis: FC-M10-010; Proposed<br>**AC-IAM-009-02-02** — **Given** a delegation is created, revoked or ends, **when** the change happens, **then** AUD-IAM-007 is written with delegator, delegate, permission and dates. Basis: D; FC-M10-010 |

**Business rules applied:** BR-IAM-070 (§8.1).


### 7.10 PRD-IAM-010 User administration console

| Item | Value |
|---|---|
| Description (baseline) | A screen for staff to find users, view their details, activate or deactivate them and, when helping them, see the shop as they see it, with every action recorded. Customers can deactivate their own account and later reactivate it. |
| Why it matters | Support staff can solve customer problems quickly and safely. |
| Who benefits | Support staff |
| Phase | P1 |
| Implementation | Code-level — Custom plugin |
| Depends on | — |
| Status | Ready |

**Use case US-IAM-010-01**

| Attribute | Description |
|---|---|
| User Story | As a user administrator, I want to find users and view their details, so that I can help customers quickly. |
| Use Case ID | US-IAM-010-01 |
| Use Case Name | To find users and view their details |
| Actor(s) | • User administrator<br>• Platform (IAM plugin) |
| Preconditions | • A user holds Customers.CustomersView. |
| Trigger | The user searches by email, name, phone, company, role, registration date or last activity. |
| Basic Flow | 1. Trigger: the user searches by email, name, phone, company, role, registration date or last activity.<br>2. The system responds: matching customers are listed and each record can be opened (native admin customer list) (AC-IAM-010-01-01). |
| Alternate Flows | Not stated in source |
| Exception Flow | Not stated in source |
| Postconditions | • Matching customers are listed and each record can be opened (native admin customer list) (AC-IAM-010-01-01). |
| Business Rules | • BR-IAM-080 — Read-access logging: an IAM global action filter on admin actions that display one customer personal data (Customer Edit, Order Edit, customer address edit<br>• BR-IAM-081 — Deactivation (by the customer or by staff) keeps all data and stops sign-in and marketing<br>• BR-IAM-054 — Permission exclusions declared by modules are checked when a pack is validated (IC-PLT-01) and when a mapping is saved in SecurityController.PermissionEditPopup [POST] (IAM action filter): Vendors never hold Orders.ReturnRequestsView or Orders.ReturnRequestsCreateEditDelete (RET)<br>• BR-IAM-130 — Assisted service and acting sessions: each agent has a personal account (never shared) and at least one assigned outlet |
| Notes | • Permissions: Customers.CustomersView<br>• Story basis: D; REQ-MPC-FR-024 |
| Readiness | Ready |
| Acceptance Criteria | **AC-IAM-010-01-01** — **Given** a user holds Customers.CustomersView, **when** the user searches by email, name, phone, company, role, registration date or last activity, **then** matching customers are listed and each record can be opened (native admin customer list). Basis: REQ-MPC-FR-024; FIT (CustomerSearchModel) |

**Use case US-IAM-010-02**

| Attribute | Description |
|---|---|
| User Story | As a user administrator, I want to activate and deactivate accounts, so that I can stop or restore access without deleting data. |
| Use Case ID | US-IAM-010-02 |
| Use Case Name | To activate and deactivate accounts |
| Actor(s) | • User administrator<br>• Platform (IAM plugin) |
| Preconditions | • A user holds Customers.CustomersCreateEditDelete. |
| Trigger | The user clears the Active flag of customer C. |
| Basic Flow | 1. Trigger: the user clears the Active flag of customer C.<br>2. The system responds: C cannot log in (native NotActive result), open sessions of C end at their next request, and AUD-IAM-008 is written (AC-IAM-010-02-01).<br>3. Staff set Active again: C can log in again and AUD-IAM-008 is written (AC-IAM-010-02-02). |
| Alternate Flows | Not stated in source |
| Exception Flow | Not stated in source |
| Postconditions | • C can log in again and AUD-IAM-008 is written (AC-IAM-010-02-02). |
| Business Rules | • BR-IAM-080 — Read-access logging: an IAM global action filter on admin actions that display one customer personal data (Customer Edit, Order Edit, customer address edit<br>• BR-IAM-081 — Deactivation (by the customer or by staff) keeps all data and stops sign-in and marketing<br>• BR-IAM-054 — Permission exclusions declared by modules are checked when a pack is validated (IC-PLT-01) and when a mapping is saved in SecurityController.PermissionEditPopup [POST] (IAM action filter): Vendors never hold Orders.ReturnRequestsView or Orders.ReturnRequestsCreateEditDelete (RET)<br>• BR-IAM-130 — Assisted service and acting sessions: each agent has a personal account (never shared) and at least one assigned outlet |
| Notes | • Permissions: Customers.CustomersCreateEditDelete<br>• Audit events: AUD-IAM-008<br>• Story basis: D; REQ-MPC-FR-016; REQ-MPC-FR-024 |
| Readiness | Ready |
| Acceptance Criteria | **AC-IAM-010-02-01** — **Given** a user holds Customers.CustomersCreateEditDelete, **when** the user clears the Active flag of customer C, **then** C cannot log in (native NotActive result), open sessions of C end at their next request, and AUD-IAM-008 is written. Basis: REQ-MPC-FR-016; FIT<br>**AC-IAM-010-02-02** — **Given** customer C was deactivated by staff, **when** staff set Active again, **then** C can log in again and AUD-IAM-008 is written. Basis: REQ-MPC-FR-016 |

**Use case US-IAM-010-03**

| Attribute | Description |
|---|---|
| User Story | As a user administrator, I want to see the shop as the customer sees it, with a record kept, so that I can reproduce problems. |
| Use Case ID | US-IAM-010-03 |
| Use Case Name | To see the shop as the customer sees it, with a record kept |
| Actor(s) | • User administrator<br>• Platform (IAM plugin)<br>• CRM-015 (B2B account management) |
| Preconditions | • A member of Administrators holds Customers.CustomersImpersonation. |
| Trigger | The user starts impersonation of an active customer. |
| Basic Flow | 1. Trigger: the user starts impersonation of an active customer.<br>2. The system responds: the IAM impersonation filter allows it (BR-IAM-130), the storefront is shown as that customer and the native activity Impersonation.Started is written for both people (AC-IAM-010-03-01). |
| Alternate Flows | Not stated in source |
| Exception Flow | • A user holds Customers.CustomersImpersonation, is not in Administrators, and no registered rule provider (IAM-026 agent rule, CRM-015 account-manager rule) allows the request: when the user posts the impersonation action, the IAM impersonation filter refuses it with message Iam.ImpersonationNotAllowed (or the refusing provider message), no impersonation starts and AUD-IAM-019 is written (AC-IAM-010-03-02).<br>• A user who is not an administrator is allowed by a rule provider for a customer who is an administrator: when the request reaches the native action, the native action refuses it (Admin.Customers.Customers.NonAdminNotImpersonateAsAdminError); the IAM filter does not relax native checks (AC-IAM-010-03-03). |
| Postconditions | • The IAM impersonation filter allows it (BR-IAM-130), the storefront is shown as that customer and the native activity Impersonation.Started is written for both people (AC-IAM-010-03-01). |
| Business Rules | • BR-IAM-130 — Assisted service and acting sessions: each agent has a personal account (never shared) and at least one assigned outlet |
| Notes | • Messages and templates: Iam.ImpersonationNotAllowed<br>• Permissions: Customers.CustomersImpersonation<br>• Audit events: AUD-IAM-019<br>• Story basis: D |
| Readiness | Ready |
| Acceptance Criteria | **AC-IAM-010-03-01** — **Given** a member of Administrators holds Customers.CustomersImpersonation, **when** the user starts impersonation of an active customer, **then** the IAM impersonation filter allows it (BR-IAM-130), the storefront is shown as that customer and the native activity Impersonation.Started is written for both people. Basis: FIT (Admin CustomerController.Impersonate)<br>**AC-IAM-010-03-02** — **Given** a user holds Customers.CustomersImpersonation, is not in Administrators, and no registered rule provider (IAM-026 agent rule, CRM-015 account-manager rule) allows the request, **when** the user posts the impersonation action, **then** the IAM impersonation filter refuses it with message Iam.ImpersonationNotAllowed (or the refusing provider message), no impersonation starts and AUD-IAM-019 is written. Basis: Proposed (owner decision: one impersonation filter, IAM-026)<br>**AC-IAM-010-03-03** — **Given** a user who is not an administrator is allowed by a rule provider for a customer who is an administrator, **when** the request reaches the native action, **then** the native action refuses it (Admin.Customers.Customers.NonAdminNotImpersonateAsAdminError); the IAM filter does not relax native checks. Basis: FIT (Impersonate checks IsAdminAsync) |

**Use case US-IAM-010-04**

| Attribute | Description |
|---|---|
| User Story | As a shopper, I want to deactivate my own account and reactivate it later, so that I control my account. |
| Use Case ID | US-IAM-010-04 |
| Use Case Name | To deactivate my own account and reactivate it later |
| Actor(s) | • Shopper<br>• Platform (IAM plugin) |
| Preconditions | • A signed-in shopper. |
| Trigger | The shopper chooses "Deactivate my account" and confirms with the password or a one-time code. |
| Basic Flow | 1. Trigger: the shopper chooses "Deactivate my account" and confirms with the password or a one-time code.<br>2. The system responds: the account becomes inactive, all sessions end, message Iam.AccountDeactivated is shown, no data is deleted and marketing messages stop (BR-IAM-081) (AC-IAM-010-04-01).<br>3. The owner requests reactivation and confirms a code sent to the verified email or mobile number: the account becomes active again and message Iam.AccountReactivated is shown (AC-IAM-010-04-02). |
| Alternate Flows | Not stated in source |
| Exception Flow | • The account was deactivated by staff: when the owner requests reactivation, self-reactivation is refused and message Iam.ContactSupport is shown (AC-IAM-010-04-03). |
| Postconditions | • The account becomes inactive, all sessions end, message Iam.AccountDeactivated is shown, no data is deleted and marketing messages stop (BR-IAM-081) (AC-IAM-010-04-01). |
| Business Rules | • BR-IAM-081 — Deactivation (by the customer or by staff) keeps all data and stops sign-in and marketing |
| Notes | • Messages and templates: Iam.AccountDeactivated, Iam.AccountReactivated, Iam.ContactSupport<br>• Story basis: D; REQ-MPC-FR-016 |
| Readiness | Ready |
| Acceptance Criteria | **AC-IAM-010-04-01** — **Given** a signed-in shopper, **when** the shopper chooses "Deactivate my account" and confirms with the password or a one-time code, **then** the account becomes inactive, all sessions end, message Iam.AccountDeactivated is shown, no data is deleted and marketing messages stop (BR-IAM-081). Basis: D; REQ-MPC-FR-016<br>**AC-IAM-010-04-02** — **Given** the account was deactivated by its owner, **when** the owner requests reactivation and confirms a code sent to the verified email or mobile number, **then** the account becomes active again and message Iam.AccountReactivated is shown. Basis: REQ-MPC-FR-016<br>**AC-IAM-010-04-03** — **Given** the account was deactivated by staff, **when** the owner requests reactivation, **then** self-reactivation is refused and message Iam.ContactSupport is shown. Basis: Proposed |

**Use case US-IAM-010-05**

| Attribute | Description |
|---|---|
| User Story | As an auditor, I want every staff action on user accounts to be recorded, so that misuse can be traced. |
| Use Case ID | US-IAM-010-05 |
| Use Case Name | Every staff action on user accounts to be recorded |
| Actor(s) | • Auditor<br>• Platform (IAM plugin)<br>• SEC-004 (Platform audit trail) |
| Preconditions | • Staff change a customer record, its roles or its addresses. |
| Trigger | The change is saved. |
| Basic Flow | 1. Trigger: the change is saved.<br>2. The system responds: the platform audit trail (SEC-004) stores old and new values and the native activity EditCustomer is written (AC-IAM-010-05-01).<br>3. The page is shown: a read-access event AUD-IAM-010 is written (BR-IAM-080) (AC-IAM-010-05-02). |
| Alternate Flows | Not stated in source |
| Exception Flow | Not stated in source |
| Postconditions | • A read-access event AUD-IAM-010 is written (BR-IAM-080) (AC-IAM-010-05-02). |
| Business Rules | • BR-IAM-080 — Read-access logging: an IAM global action filter on admin actions that display one customer personal data (Customer Edit, Order Edit, customer address edit |
| Notes | • Audit events: AUD-IAM-010<br>• Story basis: REQ-MPC-FR-024 |
| Readiness | Ready |
| Acceptance Criteria | **AC-IAM-010-05-01** — **Given** staff change a customer record, its roles or its addresses, **when** the change is saved, **then** the platform audit trail (SEC-004) stores old and new values and the native activity EditCustomer is written. Basis: REQ-MPC-FR-024; FIT<br>**AC-IAM-010-05-02** — **Given** staff open a customer record, an order or an address of a customer in admin, **when** the page is shown, **then** a read-access event AUD-IAM-010 is written (BR-IAM-080). Basis: REQ-MPC-FR-024; Proposed |

**Business rules applied:** BR-IAM-080; BR-IAM-081; BR-IAM-054; BR-IAM-130 (§8.1).


### 7.11 PRD-IAM-011 Staff invitation and access reviews

| Item | Value |
|---|---|
| Description (baseline) | Staff are invited by email, and managers regularly confirm that each person still needs their access. Administrators can also run access audit reports showing role assignments, privileged accounts and each user's MFA status. |
| Why it matters | Removes access that is no longer needed, a common audit requirement. |
| Who benefits | Client administrators; auditors |
| Phase | P1 |
| Implementation | Code-level — Custom plugin |
| Depends on | — |
| Status | Ready |

**Use case US-IAM-011-01**

| Attribute | Description |
|---|---|
| User Story | As a client administrator, I want to invite staff by email so that they set their own password, set up MFA and accept the terms before first use, so that no one receives a password from someone else. |
| Use Case ID | US-IAM-011-01 |
| Use Case Name | To invite staff by email so that they set their own password, set up MFA and accept the terms before first use |
| Actor(s) | • Client administrator<br>• Platform (IAM plugin) |
| Preconditions | • A user holds Identity.Core.AccessGovernance.CreateEditDelete. |
| Trigger | The user invites email E with chosen roles. |
| Basic Flow | 1. Trigger: the user invites email E with chosen roles.<br>2. The system responds: an invitation email with a single-use link is sent (message template Iam.Invitation.Email, default text Iam.Invitation); the link is valid for the configured days and no customer record exists yet (AC-IAM-011-01-01).<br>3. The invitee opens it, sets a password that meets IAM-003, sets up MFA where a role requires it (IAM-004) and accepts the current terms (IAM-016): the account is created as Registered with the invited roles and the invitation becomes Accepted (AUD-IAM-017) (AC-IAM-011-01-02). |
| Alternate Flows | Not stated in source |
| Exception Flow | • An expired, revoked or already used link: when someone opens it, no account is created and message Iam.InvitationExpired is shown (AC-IAM-011-01-03). |
| Postconditions | • The account is created as Registered with the invited roles and the invitation becomes Accepted (AUD-IAM-017) (AC-IAM-011-01-02). |
| Business Rules | • BR-IAM-050 — Product role catalogue (role system names, Proposed |
| Notes | • Messages and templates: Iam.Invitation, Iam.Invitation.Email, Iam.InvitationExpired<br>• Permissions: Identity.Core.AccessGovernance.CreateEditDelete<br>• Audit events: AUD-IAM-017<br>• Story basis: D; FC-M10-011 |
| Readiness | Ready |
| Acceptance Criteria | **AC-IAM-011-01-01** — **Given** a user holds Identity.Core.AccessGovernance.CreateEditDelete, **when** the user invites email E with chosen roles, **then** an invitation email with a single-use link is sent (message template Iam.Invitation.Email, default text Iam.Invitation); the link is valid for the configured days and no customer record exists yet. Basis: D; FC-M10-011<br>**AC-IAM-011-01-02** — **Given** a valid invitation link, **when** the invitee opens it, sets a password that meets IAM-003, sets up MFA where a role requires it (IAM-004) and accepts the current terms (IAM-016), **then** the account is created as Registered with the invited roles and the invitation becomes Accepted (AUD-IAM-017). Basis: D; FC-M10-011<br>**AC-IAM-011-01-03** — **Given** an expired, revoked or already used link, **when** someone opens it, **then** no account is created and message Iam.InvitationExpired is shown. Basis: Proposed |

**Use case US-IAM-011-02**

| Attribute | Description |
|---|---|
| User Story | As a manager, I want to confirm regularly that each person still needs their access, so that access that is no longer needed is removed. |
| Use Case ID | US-IAM-011-02 |
| Use Case Name | To confirm regularly that each person still needs their access |
| Actor(s) | • Manager<br>• Platform (IAM plugin) |
| Preconditions | • An access-review campaign is started for a set of roles with a reviewer for each role. |
| Trigger | The campaign opens. |
| Basic Flow | 1. Trigger: the campaign opens.<br>2. The system responds: each reviewer sees the members of their roles and records Keep or Revoke for each; Revoke removes the role mapping through ICustomerService; every decision is audited (AUD-IAM-009) (AC-IAM-011-02-01).<br>3. The deadline task runs: the undecided items become Overdue and are listed to administrators; no role is removed automatically (AC-IAM-011-02-02). |
| Alternate Flows | Not stated in source |
| Exception Flow | Not stated in source |
| Postconditions | • The undecided items become Overdue and are listed to administrators; no role is removed automatically (AC-IAM-011-02-02). |
| Business Rules | • BR-IAM-050 — Product role catalogue (role system names, Proposed |
| Notes | • Audit events: AUD-IAM-009<br>• Story basis: D; FC-M10-013 |
| Readiness | Ready |
| Acceptance Criteria | **AC-IAM-011-02-01** — **Given** an access-review campaign is started for a set of roles with a reviewer for each role, **when** the campaign opens, **then** each reviewer sees the members of their roles and records Keep or Revoke for each; Revoke removes the role mapping through ICustomerService; every decision is audited (AUD-IAM-009). Basis: D; FC-M10-013<br>**AC-IAM-011-02-02** — **Given** the campaign deadline passes with items undecided, **when** the deadline task runs, **then** the undecided items become Overdue and are listed to administrators; no role is removed automatically. Basis: Proposed |

**Use case US-IAM-011-03**

| Attribute | Description |
|---|---|
| User Story | As an auditor, I want an access audit report with role assignments, privileged accounts and MFA status, so that I can check access controls. |
| Use Case ID | US-IAM-011-03 |
| Use Case Name | An access audit report with role assignments, privileged accounts and MFA status |
| Actor(s) | • Auditor<br>• Platform (IAM plugin) |
| Preconditions | • A user holds Identity.Core.AccessReports.View. |
| Trigger | The user runs the access audit report. |
| Basic Flow | 1. Trigger: the user runs the access audit report.<br>2. The system responds: one row per user shows: roles, whether the user is privileged (holds Security.AccessAdminPanel or a permission in the privileged list), MFA status (provider selected, none, or required but not set up — from the SelectedMultiFactorAuthenticationProvider attribute), last login and Active; the report can be exported to CSV and XLSX (AC-IAM-011-03-01).<br>3. It runs: only users that meet the privileged definition are listed (AC-IAM-011-03-02). |
| Alternate Flows | Not stated in source |
| Exception Flow | Not stated in source |
| Postconditions | • Only users that meet the privileged definition are listed (AC-IAM-011-03-02). |
| Business Rules | • BR-IAM-050 — Product role catalogue (role system names, Proposed |
| Notes | • Permissions: Identity.Core.AccessReports.View<br>• Story basis: D; REQ-MPC-FR-298 |
| Readiness | Ready |
| Acceptance Criteria | **AC-IAM-011-03-01** — **Given** a user holds Identity.Core.AccessReports.View, **when** the user runs the access audit report, **then** one row per user shows: roles, whether the user is privileged (holds Security.AccessAdminPanel or a permission in the privileged list), MFA status (provider selected, none, or required but not set up — from the SelectedMultiFactorAuthenticationProvider attribute), last login and Active; the report can be exported to CSV and XLSX. Basis: REQ-MPC-FR-298; FIT (NopCustomerDefaults.SelectedMultiFactorAuthenticationProviderAttribute)<br>**AC-IAM-011-03-02** — **Given** the report is filtered to privileged accounts, **when** it runs, **then** only users that meet the privileged definition are listed. Basis: REQ-MPC-FR-298 |

**Business rules applied:** BR-IAM-050 (§8.1).


### 7.12 PRD-IAM-012 Authentication audit and suspicious-login detection

| Item | Value |
|---|---|
| Description (baseline) | Records every login and failed login and flags unusual patterns, such as many failed attempts or logins from unexpected places; can feed a security monitoring system. |
| Why it matters | Detects account takeover attempts early. |
| Who benefits | Security team |
| Phase | P1 |
| Implementation | Code-level — Custom plugin |
| Depends on | PRD-SEC-004 |
| Status | Ready |

**Use case US-IAM-012-01**

| Attribute | Description |
|---|---|
| User Story | As a security officer, I want every login, failed login, logout, MFA challenge, password change, MFA enrolment, role change and access denial recorded with time, IP address and outcome, so that I can investigate account misuse. |
| Use Case ID | US-IAM-012-01 |
| Use Case Name | Every login, failed login, logout, MFA challenge, password change, MFA enrolment, role change and access denial recorded with time, IP address and outcome |
| Actor(s) | • Security officer<br>• Platform (IAM plugin)<br>• SEC-004 (Platform audit trail) |
| Preconditions | • The IAM plugin is installed. |
| Trigger | The configuration is applied. |
| Basic Flow | 1. Trigger: the configuration is applied.<br>2. The system responds: the native activity types PublicStore.SuccessfulLogin, PublicStore.FailedLogin and PublicStore.Logout are enabled (they are disabled at native install) and CustomerSettings.StoreIpAddresses is on (AC-IAM-012-01-01).<br>3. The event completes: an AuthEvent is written with UTC time, customer (or the identifier tried), IP address, user agent, channel and outcome, and is copied to the platform audit trail (AUD-IAM-018) (AC-IAM-012-01-02).<br>4. Any user, including an administrator, tries to edit or delete one: no screen or service offers edit or delete; the native activity log can be deleted (Customers.ActivityLogDelete) but the copy in SEC-004 cannot (AC-IAM-012-01-03). |
| Alternate Flows | Not stated in source |
| Exception Flow | Not stated in source |
| Postconditions | • No screen or service offers edit or delete; the native activity log can be deleted (Customers.ActivityLogDelete) but the copy in SEC-004 cannot (AC-IAM-012-01-03). |
| Business Rules | • BR-IAM-090 — Authentication events are append-only: the IAM plugin offers no edit or delete, and every event is copied to the SEC-004 audit trail |
| Notes | • Audit events: AUD-IAM-018<br>• Story basis: D; FC-M10-014; REQ-MPC-FR-015 |
| Readiness | Ready |
| Acceptance Criteria | **AC-IAM-012-01-01** — **Given** the IAM plugin is installed, **when** the configuration is applied, **then** the native activity types PublicStore.SuccessfulLogin, PublicStore.FailedLogin and PublicStore.Logout are enabled (they are disabled at native install) and CustomerSettings.StoreIpAddresses is on. Basis: REQ-MPC-FR-015; FIT (InstallRequiredData)<br>**AC-IAM-012-01-02** — **Given** any of these happens: login success or failure (password, code, single sign-on), logout, MFA challenge result, password change or reset, MFA enrolment or removal, role mapping change, access denied by a permission check, **when** the event completes, **then** an AuthEvent is written with UTC time, customer (or the identifier tried), IP address, user agent, channel and outcome, and is copied to the platform audit trail (AUD-IAM-018). Basis: REQ-MPC-FR-015; FC-M10-014<br>**AC-IAM-012-01-03** — **Given** AuthEvent records exist, **when** any user, including an administrator, tries to edit or delete one, **then** no screen or service offers edit or delete; the native activity log can be deleted (Customers.ActivityLogDelete) but the copy in SEC-004 cannot. Basis: FC-M10-014; FIT |

**Use case US-IAM-012-02**

| Attribute | Description |
|---|---|
| User Story | As a security officer, I want unusual login patterns flagged, such as many failures or a login from a new country, so that account takeover is detected early. |
| Use Case ID | US-IAM-012-02 |
| Use Case Name | Unusual login patterns flagged, such as many failures or a login from a new country |
| Actor(s) | • Security officer<br>• Platform (IAM plugin) |
| Preconditions | • A failed-login rule (more than N failures in M minutes for one account or one IP address) is active. |
| Trigger | The rule is exceeded. |
| Basic Flow | 1. Trigger: the rule is exceeded.<br>2. The system responds: a suspicious-login flag is raised, the security officer is notified and the flag appears in the console (SM-IAM-12) (AC-IAM-012-02-01).<br>3. A customer logs in from a country (IGeoLookupService with the bundled GeoLite2-Country database) not seen for that customer in the look-back period: a flag is raised and, if the setting is on, the customer receives message template Iam.NewCountryLogin.CustomerNotification (AC-IAM-012-02-02).<br>4. The security officer confirms it: the officer can force the user off (IAM-006) and the flag becomes Confirmed; dismissing needs a reason (AUD-IAM-016) (AC-IAM-012-02-03). |
| Alternate Flows | Not stated in source |
| Exception Flow | Not stated in source |
| Postconditions | • The officer can force the user off (IAM-006) and the flag becomes Confirmed; dismissing needs a reason (AUD-IAM-016) (AC-IAM-012-02-03). |
| Business Rules | • BR-IAM-090 — Authentication events are append-only: the IAM plugin offers no edit or delete, and every event is copied to the SEC-004 audit trail |
| Notes | • Messages and templates: Iam.NewCountryLogin.CustomerNotification<br>• State models: SM-IAM-12<br>• Audit events: AUD-IAM-016<br>• Story basis: D; FC-M10-015 |
| Readiness | Ready |
| Acceptance Criteria | **AC-IAM-012-02-01** — **Given** a failed-login rule (more than N failures in M minutes for one account or one IP address) is active, **when** the rule is exceeded, **then** a suspicious-login flag is raised, the security officer is notified and the flag appears in the console (SM-IAM-12). Basis: D; FC-M10-015<br>**AC-IAM-012-02-02** — **Given** the new-country rule is active, **when** a customer logs in from a country (IGeoLookupService with the bundled GeoLite2-Country database) not seen for that customer in the look-back period, **then** a flag is raised and, if the setting is on, the customer receives message template Iam.NewCountryLogin.CustomerNotification. Basis: D; FIT (IGeoLookupService.LookupCountryIsoCodeAsync; 5.00.1 removed the synchronous lookups, Libraries/Nop.Services/Directory/IGeoLookupService.cs:16)<br>**AC-IAM-012-02-03** — **Given** a flag is open, **when** the security officer confirms it, **then** the officer can force the user off (IAM-006) and the flag becomes Confirmed; dismissing needs a reason (AUD-IAM-016). Basis: Proposed |

**Use case US-IAM-012-03**

| Attribute | Description |
|---|---|
| User Story | As a security officer, I want authentication events available to our security monitoring system and to auditors, so that monitoring and audit can use them. |
| Use Case ID | US-IAM-012-03 |
| Use Case Name | Authentication events available to our security monitoring system and to auditors |
| Actor(s) | • Security officer<br>• Platform (IAM plugin)<br>• SEC-005 (Anomaly and correlation detection) |
| Preconditions | • A user holds Identity.Core.AuthEvents.View. |
| Trigger | The user filters by date, customer, IP address and outcome. |
| Basic Flow | 1. Trigger: the user filters by date, customer, IP address and outcome.<br>2. The system responds: matching events are listed and can be exported to CSV (AC-IAM-012-03-01).<br>3. Authentication events are written: they are sent through IC-SEC-02 in the agreed format (AC-IAM-012-03-02). |
| Alternate Flows | Not stated in source |
| Exception Flow | Not stated in source |
| Postconditions | • They are sent through IC-SEC-02 in the agreed format (AC-IAM-012-03-02). |
| Business Rules | • BR-IAM-090 — Authentication events are append-only: the IAM plugin offers no edit or delete, and every event is copied to the SEC-004 audit trail |
| Notes | • Permissions: Identity.Core.AuthEvents.View<br>• Contracts: IC-SEC-02<br>• Story basis: D; REQ-MPC-FR-015 |
| Readiness | Ready |
| Acceptance Criteria | **AC-IAM-012-03-01** — **Given** a user holds Identity.Core.AuthEvents.View, **when** the user filters by date, customer, IP address and outcome, **then** matching events are listed and can be exported to CSV. Basis: REQ-MPC-FR-015<br>**AC-IAM-012-03-02** — **Given** the security-monitoring export is configured (SEC-005), **when** authentication events are written, **then** they are sent through IC-SEC-02 in the agreed format. Basis: REQ-MPC-FR-015 |

**Business rules applied:** BR-IAM-090 (§8.1).


### 7.13 PRD-IAM-013 Passwordless and biometric login

| Item | Value |
|---|---|
| Description (baseline) | Log in with a fingerprint, face recognition or device security key instead of a password. |
| Why it matters | Faster and safer logins. |
| Who benefits | Shoppers; staff |
| Phase | P2 |
| Implementation | Code-level — Custom plugin |
| Depends on | — |
| Status | Ready |

**Use case US-IAM-013-01**

| Attribute | Description |
|---|---|
| User Story | As a shopper or member of staff, I want to log in with a fingerprint, face recognition or a device security key instead of a password, so that logging in is faster and safer. |
| Use Case ID | US-IAM-013-01 |
| Use Case Name | To log in with a fingerprint, face recognition or a device security key instead of a password |
| Actor(s) | • Shopper or member of staff<br>• Platform (IAM plugin) |
| Preconditions | • A signed-in user on a device that supports passkeys. |
| Trigger | The user registers a passkey. |
| Basic Flow | 1. Trigger: the user registers a passkey.<br>2. The system responds: the public key credential is stored for the user and listed under My account, where it can be removed (AC-IAM-013-01-01).<br>3. The user chooses "log in with passkey" and the device verifies the user: the user is signed in through SignInCustomerAsync without a password (AC-IAM-013-01-02).<br>4. The login page is shown: password and one-time code login remain available (AC-IAM-013-01-03).<br>5. The user logs in with a passkey that verified the user on the device: the login completes and no second-factor prompt is shown, because the passkey user verification counts as the second factor required by IAM-004 (AC-IAM-013-01-04). |
| Alternate Flows | Not stated in source |
| Exception Flow | Not stated in source |
| Postconditions | • The public key credential is stored for the user and listed under My account, where it can be removed (AC-IAM-013-01-01). |
| Business Rules | Not stated in source |
| Notes | • Story basis: D; FC-M10-005 |
| Readiness | Ready |
| Acceptance Criteria | **AC-IAM-013-01-01** — **Given** a signed-in user on a device that supports passkeys, **when** the user registers a passkey, **then** the public key credential is stored for the user and listed under My account, where it can be removed. Basis: D; FC-M10-005<br>**AC-IAM-013-01-02** — **Given** a user with a registered passkey, **when** the user chooses "log in with passkey" and the device verifies the user, **then** the user is signed in through SignInCustomerAsync without a password. Basis: D<br>**AC-IAM-013-01-03** — **Given** the device or browser does not support passkeys, **when** the login page is shown, **then** password and one-time code login remain available. Basis: Proposed<br>**AC-IAM-013-01-04** — **Given** the user is in an MFA-required role, **when** the user logs in with a passkey that verified the user on the device, **then** the login completes and no second-factor prompt is shown, because the passkey user verification counts as the second factor required by IAM-004. Basis: Proposed |

**Business rules applied:** none specific to this feature (§8.1 lists the module rules).


### 7.14 PRD-IAM-014 Customer profile and address book

| Item | Value |
|---|---|
| Description (baseline) | Customers manage their personal details and save several delivery addresses, choosing a default. |
| Why it matters | Faster checkout and fewer delivery mistakes. |
| Who benefits | Shoppers |
| Phase | P1 |
| Implementation | Code-level — Theme/view override + Custom plugin |
| Depends on | — |
| Status | Ready |

**Use case US-IAM-014-01**

| Attribute | Description |
|---|---|
| User Story | As a shopper, I want to keep my name and contact details up to date, so that orders and messages reach me. |
| Use Case ID | US-IAM-014-01 |
| Use Case Name | To keep my name and contact details up to date |
| Actor(s) | • Shopper<br>• Platform (IAM plugin) |
| Preconditions | • A signed-in shopper on the My account information page. |
| Trigger | The shopper changes name, phone or email and saves. |
| Basic Flow | 1. Trigger: the shopper changes name, phone or email and saves.<br>2. The system responds: the values are saved; an email change follows the native revalidation when registration type is EmailValidation; with GdprSettings.LogUserProfileChanges on, the change is written to the GDPR log (AC-IAM-014-01-01).<br>3. The shopper changes the number: the new number replaces the identifier only after a code sent to it is entered correctly (AC-IAM-014-01-02). |
| Alternate Flows | Not stated in source |
| Exception Flow | Not stated in source |
| Postconditions | • The values are saved; an email change follows the native revalidation when registration type is EmailValidation; with GdprSettings.LogUserProfileChanges on, the change is written to the GDPR log (AC-IAM-014-01-01). |
| Business Rules | Not stated in source |
| Notes | • Story basis: D; REQ-MPC-FR-004 |
| Readiness | Ready |
| Acceptance Criteria | **AC-IAM-014-01-01** — **Given** a signed-in shopper on the My account information page, **when** the shopper changes name, phone or email and saves, **then** the values are saved; an email change follows the native revalidation when registration type is EmailValidation; with GdprSettings.LogUserProfileChanges on, the change is written to the GDPR log. Basis: REQ-MPC-FR-004; FIT<br>**AC-IAM-014-01-02** — **Given** the account uses the mobile number as identifier (IAM-002), **when** the shopper changes the number, **then** the new number replaces the identifier only after a code sent to it is entered correctly. Basis: Proposed; FIT (5.00.1 native My account information saves the new number at once, clears Customer.PhoneSmsVerified and then runs the ChangePhoneNumber code verification, CustomerController.cs:1631-1636, 1704-1707; PhoneIdentity keeps the old identifier until the code is entered) |

**Use case US-IAM-014-02**

| Attribute | Description |
|---|---|
| User Story | As a shopper, I want to save several delivery addresses and choose a default, so that checkout is faster and deliveries go to the right place. |
| Use Case ID | US-IAM-014-02 |
| Use Case Name | To save several delivery addresses and choose a default |
| Actor(s) | • Shopper<br>• Platform (IAM plugin) |
| Preconditions | • A signed-in shopper in My account Addresses. |
| Trigger | The shopper adds, edits or deletes addresses. |
| Basic Flow | 1. Trigger: the shopper adds, edits or deletes addresses.<br>2. The system responds: each change is saved and the list shows all saved addresses (AC-IAM-014-02-01).<br>3. The shopper marks one as default: that address is shown first and marked as default; checkout pre-selects it (CHK, carried) (AC-IAM-014-02-02).<br>4. The shopper reaches the address step: the saved addresses are offered without retyping (AC-IAM-014-02-03). |
| Alternate Flows | Not stated in source |
| Exception Flow | Not stated in source |
| Postconditions | • Each change is saved and the list shows all saved addresses (AC-IAM-014-02-01). |
| Business Rules | Not stated in source |
| Notes | • Story basis: D; REQ-MPC-FR-005; REQ-KTDA-CUS-005 |
| Readiness | Ready |
| Acceptance Criteria | **AC-IAM-014-02-01** — **Given** a signed-in shopper in My account Addresses, **when** the shopper adds, edits or deletes addresses, **then** each change is saved and the list shows all saved addresses. Basis: REQ-MPC-FR-005; FIT (CustomerController.Addresses, AddressAdd, AddressEdit, AddressDelete)<br>**AC-IAM-014-02-02** — **Given** a shopper has several addresses, **when** the shopper marks one as default, **then** that address is shown first and marked as default; checkout pre-selects it (CHK, carried). Basis: D; REQ-MPC-FR-005<br>**AC-IAM-014-02-03** — **Given** a shopper with saved addresses buys again, **when** the shopper reaches the address step, **then** the saved addresses are offered without retyping. Basis: REQ-KTDA-CUS-005 |

**Business rules applied:** none specific to this feature (§8.1 lists the module rules).


### 7.15 PRD-IAM-015 Pickup preference and preferred channel

| Item | Value |
|---|---|
| Description (baseline) | Customers can save a preferred pickup point (such as a post office) and how they want to be contacted (SMS, email, app). |
| Why it matters | Orders go where the customer wants and messages arrive the way they prefer. |
| Who benefits | Shoppers |
| Phase | P1 |
| Implementation | Code-level — Custom plugin |
| Depends on | — |
| Status | Ready |

**Use case US-IAM-015-01**

| Attribute | Description |
|---|---|
| User Story | As a shopper, I want to save a preferred pickup point such as a post office, so that pickup orders go there without choosing each time. |
| Use Case ID | US-IAM-015-01 |
| Use Case Name | To save a preferred pickup point such as a post office |
| Actor(s) | • Shopper<br>• Platform (IAM plugin) |
| Preconditions | • Pickup points exist (PRD-LOG-003, StorePickupPoint). |
| Trigger | The shopper selects one as preferred in My account. |
| Basic Flow | 1. Trigger: the shopper selects one as preferred in My account.<br>2. The system responds: it is saved; the checkout pickup option pre-selects it (CHK, carried) (AC-IAM-015-01-01).<br>3. The shopper next opens checkout or My account: the preference is cleared and the shopper is asked to choose another with message Iam.PickupPointUnavailable (AC-IAM-015-01-02). |
| Alternate Flows | Not stated in source |
| Exception Flow | Not stated in source |
| Postconditions | • It is saved; the checkout pickup option pre-selects it (CHK, carried) (AC-IAM-015-01-01). |
| Business Rules | Not stated in source |
| Notes | • Messages and templates: Iam.PickupPointUnavailable<br>• Story basis: D; REQ-MPC-FR-005 |
| Readiness | Ready |
| Acceptance Criteria | **AC-IAM-015-01-01** — **Given** pickup points exist (PRD-LOG-003, StorePickupPoint), **when** the shopper selects one as preferred in My account, **then** it is saved; the checkout pickup option pre-selects it (CHK, carried). Basis: REQ-MPC-FR-005<br>**AC-IAM-015-01-02** — **Given** the preferred pickup point is closed or removed, **when** the shopper next opens checkout or My account, **then** the preference is cleared and the shopper is asked to choose another with message Iam.PickupPointUnavailable. Basis: Proposed |

**Use case US-IAM-015-02**

| Attribute | Description |
|---|---|
| User Story | As a shopper, I want to choose how I want to be contacted (SMS, email, app), so that messages arrive the way I prefer. |
| Use Case ID | US-IAM-015-02 |
| Use Case Name | To choose how I want to be contacted (SMS, email, app) |
| Actor(s) | • Shopper<br>• Platform (IAM plugin)<br>• CHN-001 (Native mobile apps)<br>• CHN-013 (Push notifications)<br>• TRK-005 (Notification engine (multi-channel))<br>• TRK-006 (Notification preferences) |
| Preconditions | • The channels configured in the notification engine (TRK-005) are listed. |
| Trigger | The shopper selects a preferred channel. |
| Basic Flow | 1. Trigger: the shopper selects a preferred channel.<br>2. The system responds: it is saved and TRK-006 uses it for every event that has no event-level preference (AC-IAM-015-02-01).<br>3. The shopper opens the channel choice: the app channel is not offered (AC-IAM-015-02-02). |
| Alternate Flows | Not stated in source |
| Exception Flow | Not stated in source |
| Postconditions | • It is saved and TRK-006 uses it for every event that has no event-level preference (AC-IAM-015-02-01). |
| Business Rules | Not stated in source |
| Notes | • Story basis: D; REQ-MPC-FR-004 |
| Readiness | Ready |
| Acceptance Criteria | **AC-IAM-015-02-01** — **Given** the channels configured in the notification engine (TRK-005) are listed, **when** the shopper selects a preferred channel, **then** it is saved and TRK-006 uses it for every event that has no event-level preference. Basis: REQ-MPC-FR-004<br>**AC-IAM-015-02-02** — **Given** the app channel is not enabled for the store (CHN-001 / CHN-013 not active), **when** the shopper opens the channel choice, **then** the app channel is not offered. Basis: Proposed |

**Business rules applied:** none specific to this feature (§8.1 lists the module rules).


### 7.16 PRD-IAM-016 Terms acceptance with versioning

| Item | Value |
|---|---|
| Description (baseline) | Records when each customer accepted the terms and privacy policy, and asks them to accept again when a new version is published. |
| Why it matters | Provides proof of consent for legal purposes. |
| Who benefits | Clients; regulators |
| Phase | P1 |
| Implementation | Code-level — Custom plugin |
| Depends on | — |
| Status | Ready; conditions: ONE-RECORD |

**Use case US-IAM-016-01**

| Attribute | Description |
|---|---|
| User Story | As a shopper, I want to accept the terms of use and the privacy policy when I register, so that the agreement is clear from the start. |
| Use Case ID | US-IAM-016-01 |
| Use Case Name | To accept the terms of use and the privacy policy when I register |
| Actor(s) | • Shopper<br>• Platform (IAM plugin)<br>• MKT-008 (Content approval and policy versioning) |
| Preconditions | • Current versions of the terms of use and the privacy policy are published. |
| Trigger | A person registers by web, mobile number or through an agent. |
| Basic Flow | 1. Trigger: a person registers by web, mobile number or through an agent.<br>2. The system responds: registration cannot complete without acceptance, and a PolicyAcceptance row records policy, version, time, channel, IP address and agent (if any) (AC-IAM-016-01-01).<br>3. An acceptance is recorded: the version number stored is the Effective version returned by IC-MKT-03 GetEffectivePolicyVersion at that time; IAM stores no policy text and creates no version (BR-IAM-091) (AC-IAM-016-01-02).<br>4. An acceptance is recorded: it is stored with version "unversioned" and the topic and time, and no re-acceptance prompt can be raised for that policy (AC-IAM-016-01-03). |
| Alternate Flows | Not stated in source |
| Exception Flow | Not stated in source |
| Postconditions | • The version number stored is the Effective version returned by IC-MKT-03 GetEffectivePolicyVersion at that time; IAM stores no policy text and creates no version (BR-IAM-091) (AC-IAM-016-01-02). |
| Business Rules | • BR-IAM-091 — Policy acceptance is recorded only by IAM (IC-IAM-05), per policy system name and version, for a customer and, for seller terms, the vendor (SEL-006 records through IC-IAM-05) |
| Notes | • Contracts: IC-MKT-03<br>• Story basis: D; REQ-MPC-FR-006 |
| Readiness | Ready; conditions: ONE-RECORD |
| Acceptance Criteria | **AC-IAM-016-01-01** — **Given** current versions of the terms of use and the privacy policy are published, **when** a person registers by web, mobile number or through an agent, **then** registration cannot complete without acceptance, and a PolicyAcceptance row records policy, version, time, channel, IP address and agent (if any). Basis: REQ-MPC-FR-006; FIT (native AcceptPrivacyPolicyEnabled covers the privacy policy only, without version)<br>**AC-IAM-016-01-02** — **Given** a policy topic is under MKT-008 versioning, **when** an acceptance is recorded, **then** the version number stored is the Effective version returned by IC-MKT-03 GetEffectivePolicyVersion at that time; IAM stores no policy text and creates no version (BR-IAM-091). Basis: REQ-MPC-FR-006; see MKT-008 (REQ-MPC-FR-306)<br>**AC-IAM-016-01-03** — **Given** IC-MKT-03 returns "no version" for a policy (not under versioning, or MKT-008 not yet available), **when** an acceptance is recorded, **then** it is stored with version "unversioned" and the topic and time, and no re-acceptance prompt can be raised for that policy. Basis: Proposed |

**Use case US-IAM-016-02**

| Attribute | Description |
|---|---|
| User Story | As a shopper, I want to be asked to accept again when a new version is published, so that I know about changes that affect me. |
| Use Case ID | US-IAM-016-02 |
| Use Case Name | To be asked to accept again when a new version is published |
| Actor(s) | • Shopper<br>• Platform (IAM plugin)<br>• MKT-008 (Content approval and policy versioning)<br>• SEL-006 (Seller terms acceptance) |
| Preconditions | • IC-MKT-03 GetEffectivePolicyVersion returns a new Effective version of a policy with the MKT-008 flag "re-acceptance required" set. |
| Trigger | A registered user who accepted an older version makes a request. |
| Basic Flow | 1. Trigger: a registered user who accepted an older version makes a request.<br>2. The system responds: the user is redirected to the acceptance page with message Iam.TermsUpdated until the new version is accepted; logout and the policy pages stay reachable (BR-IAM-091) (AC-IAM-016-02-01).<br>3. Users make requests: no prompt is shown; later acceptances (for example at registration) record the new version; IAM keeps no re-acceptance flag of its own (AC-IAM-016-02-03).<br>4. The owner user of an approved seller makes a request in the seller portal: the IAM re-acceptance filter redirects the owner to the acceptance page until the new version is accepted; the acceptance is stored with customer, vendor and version (AC-IAM-016-02-04). |
| Alternate Flows | • The user declines the new version: when the decline is saved, the decline is recorded, the user is signed out with message Iam.TermsDeclined and can only sign in again by accepting (AC-IAM-016-02-02). |
| Exception Flow | Not stated in source |
| Postconditions | • The IAM re-acceptance filter redirects the owner to the acceptance page until the new version is accepted; the acceptance is stored with customer, vendor and version (AC-IAM-016-02-04). |
| Business Rules | • BR-IAM-091 — Policy acceptance is recorded only by IAM (IC-IAM-05), per policy system name and version, for a customer and, for seller terms, the vendor (SEL-006 records through IC-IAM-05) |
| Notes | • Messages and templates: Iam.TermsDeclined, Iam.TermsUpdated<br>• Contracts: IC-IAM-05, IC-MKT-03<br>• Story basis: D; REQ-MPC-FR-006 |
| Readiness | Ready; conditions: ONE-RECORD |
| Acceptance Criteria | **AC-IAM-016-02-01** — **Given** IC-MKT-03 GetEffectivePolicyVersion returns a new Effective version of a policy with the MKT-008 flag "re-acceptance required" set, **when** a registered user who accepted an older version makes a request, **then** the user is redirected to the acceptance page with message Iam.TermsUpdated until the new version is accepted; logout and the policy pages stay reachable (BR-IAM-091). Basis: REQ-MPC-FR-006<br>**AC-IAM-016-02-02** — **Given** the user declines the new version, **when** the decline is saved, **then** the decline is recorded, the user is signed out with message Iam.TermsDeclined and can only sign in again by accepting. Basis: Proposed<br>**AC-IAM-016-02-03** — **Given** IC-MKT-03 returns a new Effective version with the "re-acceptance required" flag not set, **when** users make requests, **then** no prompt is shown; later acceptances (for example at registration) record the new version; IAM keeps no re-acceptance flag of its own. Basis: Proposed; see MKT-008 (REQ-MPC-FR-306)<br>**AC-IAM-016-02-04** — **Given** the seller terms (topic VendorTermsOfService) have a new Effective version, the client setting requires re-acceptance and SEL-006 records seller acceptances through IC-IAM-05 with the vendor, **when** the owner user of an approved seller makes a request in the seller portal, **then** the IAM re-acceptance filter redirects the owner to the acceptance page until the new version is accepted; the acceptance is stored with customer, vendor and version. Basis: see SEL-006 (REQ-MPC-FR-030); Proposed |

**Use case US-IAM-016-03**

| Attribute | Description |
|---|---|
| User Story | As a member of support staff, I want to see when a customer accepted each version and gave or withdrew each consent, so that I can resolve complaints with evidence. |
| Use Case ID | US-IAM-016-03 |
| Use Case Name | To see when a customer accepted each version and gave or withdrew each consent |
| Actor(s) | • Member of support staff<br>• Platform (IAM plugin)<br>• CRM-003 (Agent 360° view) |
| Preconditions | • A user holds Identity.Core.ConsentTrail.View. |
| Trigger | The user opens the consent trail of a customer. |
| Basic Flow | 1. Trigger: the user opens the consent trail of a customer.<br>2. The system responds: PolicyAcceptance rows and the native GDPR log consent entries (ConsentAgree, ConsentDisagree) are listed in time order, read-only (AC-IAM-016-03-01). |
| Alternate Flows | Not stated in source |
| Exception Flow | • A CRM-003 agent holds Identity.Core.ConsentTrail.View: when the 360-degree view calls IC-IAM-05 GetConsentTrail for the customer, the same entries are returned (policy, version, decision, channel, time; consent agree or disagree with time), read-only; without the permission the call is refused (AC-IAM-016-03-02). |
| Postconditions | • PolicyAcceptance rows and the native GDPR log consent entries (ConsentAgree, ConsentDisagree) are listed in time order, read-only (AC-IAM-016-03-01). |
| Business Rules | • BR-IAM-091 — Policy acceptance is recorded only by IAM (IC-IAM-05), per policy system name and version, for a customer and, for seller terms, the vendor (SEL-006 records through IC-IAM-05) |
| Notes | • Permissions: Identity.Core.ConsentTrail.View<br>• Contracts: IC-IAM-05<br>• Story basis: REQ-MPC-FR-022 |
| Readiness | Ready; conditions: ONE-RECORD |
| Acceptance Criteria | **AC-IAM-016-03-01** — **Given** a user holds Identity.Core.ConsentTrail.View, **when** the user opens the consent trail of a customer, **then** PolicyAcceptance rows and the native GDPR log consent entries (ConsentAgree, ConsentDisagree) are listed in time order, read-only. Basis: REQ-MPC-FR-022; FIT (GdprLog)<br>**AC-IAM-016-03-02** — **Given** a CRM-003 agent holds Identity.Core.ConsentTrail.View, **when** the 360-degree view calls IC-IAM-05 GetConsentTrail for the customer, **then** the same entries are returned (policy, version, decision, channel, time; consent agree or disagree with time), read-only; without the permission the call is refused. Basis: REQ-MPC-FR-022 |

**Business rules applied:** BR-IAM-091 (§8.1).


### 7.17 PRD-IAM-017 Privacy rights

| Item | Value |
|---|---|
| Description (baseline) | Customers can give or withdraw consent, download their personal data, ask for it to be corrected, or ask for their account to be deleted. |
| Why it matters | Meets data-protection law and builds trust. |
| Who benefits | Shoppers; clients |
| Phase | P1 |
| Implementation | Code-level — Custom plugin |
| Depends on | PRD-SEC-012 |
| Status | Ready |

**Use case US-IAM-017-01**

| Attribute | Description |
|---|---|
| User Story | As a shopper, I want to give or withdraw my consent to marketing and to cookies and tracking, so that my choices are respected. |
| Use Case ID | US-IAM-017-01 |
| Use Case Name | To give or withdraw my consent to marketing and to cookies and tracking |
| Actor(s) | • Shopper<br>• Platform (IAM plugin)<br>• SEC-007 (Consent and privacy tools) |
| Preconditions | • Consents (GdprConsent) are configured with DisplayOnCustomerInfoPage. |
| Trigger | The shopper ticks or clears a consent on the My account information page and saves. |
| Basic Flow | 1. Trigger: the shopper ticks or clears a consent on the My account information page and saves.<br>2. The system responds: the GDPR log records ConsentAgree or ConsentDisagree with time; a withdrawn marketing consent stops marketing messages from the next send (AC-IAM-017-01-01).<br>3. The shopper changes cookie choices from the footer link: the new choice applies from the next page (see SEC-007 (REQ-MPC-FR-010)) (AC-IAM-017-01-02).<br>4. The withdrawal is saved: the modules registered for that consent are told through IC-IAM-08 ConsentWithdrawn and stop the processing from the next request; the module decides whether stored data is deleted (AC-IAM-017-01-03). |
| Alternate Flows | Not stated in source |
| Exception Flow | Not stated in source |
| Postconditions | • The modules registered for that consent are told through IC-IAM-08 ConsentWithdrawn and stop the processing from the next request; the module decides whether stored data is deleted (AC-IAM-017-01-03). |
| Business Rules | • BR-IAM-092 — Erasure completeness: the IAM override of IGdprService.PermanentDeleteCustomerAsync calls the native method and also clears Customer.FirstName, LastName, Gender, DateOfBirth, Company, StreetAddress, StreetAddress2, ZipPostalCode, City, County, Phone (and PhoneSmsVerified), Fax, VatNumber, CustomCustomerAttributesXML, LastIpAddress and AdminComment, and the personal data in IAM plugin tables (phone identity, sessions, verification results, preferences), and calls every erasure provider registered through IC-IAM-08<br>• BR-IAM-093 — Every privacy request (staff export, correction, deletion) gets a due date from the country profile (SEC-012) |
| Notes | • Contracts: IC-IAM-08<br>• Story basis: D; REQ-MPC-FR-010 |
| Readiness | Ready |
| Acceptance Criteria | **AC-IAM-017-01-01** — **Given** consents (GdprConsent) are configured with DisplayOnCustomerInfoPage, **when** the shopper ticks or clears a consent on the My account information page and saves, **then** the GDPR log records ConsentAgree or ConsentDisagree with time; a withdrawn marketing consent stops marketing messages from the next send. Basis: REQ-MPC-FR-010; FIT<br>**AC-IAM-017-01-02** — **Given** cookie categories are configured (SEC-007), **when** the shopper changes cookie choices from the footer link, **then** the new choice applies from the next page (see SEC-007 (REQ-MPC-FR-010)). Basis: Proposed<br>**AC-IAM-017-01-03** — **Given** a customer withdraws a consent that a module uses (for example personalisation), **when** the withdrawal is saved, **then** the modules registered for that consent are told through IC-IAM-08 ConsentWithdrawn and stop the processing from the next request; the module decides whether stored data is deleted. Basis: Proposed |

**Use case US-IAM-017-02**

| Attribute | Description |
|---|---|
| User Story | As a shopper, I want to download the personal data held about me, so that I know what is held. |
| Use Case ID | US-IAM-017-02 |
| Use Case Name | To download the personal data held about me |
| Actor(s) | • Shopper<br>• Platform (IAM plugin) |
| Preconditions | • GdprSettings.GdprEnabled is on. |
| Trigger | The shopper chooses "Export my data" on the GDPR tools page. |
| Basic Flow | 1. Trigger: the shopper chooses "Export my data" on the GDPR tools page.<br>2. The system responds: the native XLSX export is downloaded, the GDPR log records ExportData, and a second file lists the personal data held in product plugin tables (Proposed) (AC-IAM-017-02-01). |
| Alternate Flows | Not stated in source |
| Exception Flow | Not stated in source |
| Postconditions | • The native XLSX export is downloaded, the GDPR log records ExportData, and a second file lists the personal data held in product plugin tables (Proposed) (AC-IAM-017-02-01). |
| Business Rules | • BR-IAM-092 — Erasure completeness: the IAM override of IGdprService.PermanentDeleteCustomerAsync calls the native method and also clears Customer.FirstName, LastName, Gender, DateOfBirth, Company, StreetAddress, StreetAddress2, ZipPostalCode, City, County, Phone (and PhoneSmsVerified), Fax, VatNumber, CustomCustomerAttributesXML, LastIpAddress and AdminComment, and the personal data in IAM plugin tables (phone identity, sessions, verification results, preferences), and calls every erasure provider registered through IC-IAM-08<br>• BR-IAM-093 — Every privacy request (staff export, correction, deletion) gets a due date from the country profile (SEC-012) |
| Notes | • Story basis: D; REQ-MPC-FR-017 |
| Readiness | Ready |
| Acceptance Criteria | **AC-IAM-017-02-01** — **Given** GdprSettings.GdprEnabled is on, **when** the shopper chooses "Export my data" on the GDPR tools page, **then** the native XLSX export is downloaded, the GDPR log records ExportData, and a second file lists the personal data held in product plugin tables (Proposed). Basis: REQ-MPC-FR-017; FIT (CustomerController.GdprToolsExport) |

**Use case US-IAM-017-03**

| Attribute | Description |
|---|---|
| User Story | As a shopper, I want to ask for my personal data used for orders and deliveries to be corrected, so that my orders and deliveries use correct details. |
| Use Case ID | US-IAM-017-03 |
| Use Case Name | To ask for my personal data used for orders and deliveries to be corrected |
| Actor(s) | • Shopper<br>• Platform (IAM plugin)<br>• SEC-012 (Country data-protection pack) |
| Preconditions | • A signed-in shopper. |
| Trigger | The shopper submits a correction request naming the field, the current value, the requested value and a reason. |
| Basic Flow | 1. Trigger: the shopper submits a correction request naming the field, the current value, the requested value and a reason.<br>2. The system responds: a PrivacyRequest of type Correction is created as Received, its due date is set from the country profile (SEC-012) and message Iam.CorrectionRequestReceived is shown (AC-IAM-017-03-01).<br>3. A user holding Customers.GDPRManage approves it: the customer field or saved address is updated, the shopper is notified, the GDPR log records ProfileChanged and AUD-IAM-011 is written; addresses already copied to placed orders are not changed by this flow (AC-IAM-017-03-02). |
| Alternate Flows | • A correction request is Received: when the reviewer rejects it with a reason, the request becomes Rejected and the shopper is told the reason (AC-IAM-017-03-03). |
| Exception Flow | Not stated in source |
| Postconditions | • A PrivacyRequest of type Correction is created as Received, its due date is set from the country profile (SEC-012) and message Iam.CorrectionRequestReceived is shown (AC-IAM-017-03-01). |
| Business Rules | • BR-IAM-092 — Erasure completeness: the IAM override of IGdprService.PermanentDeleteCustomerAsync calls the native method and also clears Customer.FirstName, LastName, Gender, DateOfBirth, Company, StreetAddress, StreetAddress2, ZipPostalCode, City, County, Phone (and PhoneSmsVerified), Fax, VatNumber, CustomCustomerAttributesXML, LastIpAddress and AdminComment, and the personal data in IAM plugin tables (phone identity, sessions, verification results, preferences), and calls every erasure provider registered through IC-IAM-08<br>• BR-IAM-093 — Every privacy request (staff export, correction, deletion) gets a due date from the country profile (SEC-012) |
| Notes | • Messages and templates: Iam.CorrectionRequestReceived<br>• Permissions: Customers.GDPRManage<br>• Audit events: AUD-IAM-011<br>• Story basis: REQ-MPC-FR-018 |
| Readiness | Ready |
| Acceptance Criteria | **AC-IAM-017-03-01** — **Given** a signed-in shopper, **when** the shopper submits a correction request naming the field, the current value, the requested value and a reason, **then** a PrivacyRequest of type Correction is created as Received, its due date is set from the country profile (SEC-012) and message Iam.CorrectionRequestReceived is shown. Basis: REQ-MPC-FR-018<br>**AC-IAM-017-03-02** — **Given** a correction request is Received, **when** a user holding Customers.GDPRManage approves it, **then** the customer field or saved address is updated, the shopper is notified, the GDPR log records ProfileChanged and AUD-IAM-011 is written; addresses already copied to placed orders are not changed by this flow. Basis: REQ-MPC-FR-018; Proposed (order addresses)<br>**AC-IAM-017-03-03** — **Given** a correction request is Received, **when** the reviewer rejects it with a reason, **then** the request becomes Rejected and the shopper is told the reason. Basis: Proposed |

**Use case US-IAM-017-04**

| Attribute | Description |
|---|---|
| User Story | As a shopper, I want to ask for my account to be deleted, so that my personal data is removed where the law allows. |
| Use Case ID | US-IAM-017-04 |
| Use Case Name | To ask for my account to be deleted |
| Actor(s) | • Shopper<br>• Platform (IAM plugin)<br>• PLT-020 (Data retention and archival)<br>• SEC-012 (Country data-protection pack)<br>• SRC-009 (Personalised recommendations and ranking)<br>• SRC-012 (Search history) |
| Preconditions | • GdprSettings.GdprEnabled is on. |
| Trigger | The shopper chooses "Delete account" on the GDPR tools page. |
| Basic Flow | 1. Trigger: the shopper chooses "Delete account" on the GDPR tools page.<br>2. The system responds: the native flow logs DeleteCustomer in the GDPR log and sends Customer.Gdpr.DeleteRequest to the store owner, and a PrivacyRequest of type Deletion is opened with its due date (AC-IAM-017-04-01).<br>3. A user holding Customers.GDPRManage runs the native GDPR delete: the IAM override of IGdprService.PermanentDeleteCustomerAsync also clears the personal fields that native code leaves (BR-IAM-092) and personal data in IAM plugin tables; orders and invoices are kept under the retention rules (PLT-020, SEC-012); AUD-IAM-011 is written (AC-IAM-017-04-02).<br>4. The IAM override of IGdprService.PermanentDeleteCustomerAsync runs: each provider is called inside the same operation and reports Erased or Failed; a Failed provider leaves the PrivacyRequest InProgress with the provider named, and the request is not Completed (BR-IAM-092) (AC-IAM-017-04-03). |
| Alternate Flows | Not stated in source |
| Exception Flow | Not stated in source |
| Postconditions | • Each provider is called inside the same operation and reports Erased or Failed; a Failed provider leaves the PrivacyRequest InProgress with the provider named, and the request is not Completed (BR-IAM-092) (AC-IAM-017-04-03). |
| Business Rules | • BR-IAM-092 — Erasure completeness: the IAM override of IGdprService.PermanentDeleteCustomerAsync calls the native method and also clears Customer.FirstName, LastName, Gender, DateOfBirth, Company, StreetAddress, StreetAddress2, ZipPostalCode, City, County, Phone (and PhoneSmsVerified), Fax, VatNumber, CustomCustomerAttributesXML, LastIpAddress and AdminComment, and the personal data in IAM plugin tables (phone identity, sessions, verification results, preferences), and calls every erasure provider registered through IC-IAM-08 |
| Notes | • Messages and templates: Customer.Gdpr.DeleteRequest<br>• Permissions: Customers.GDPRManage<br>• Contracts: IC-IAM-08<br>• Audit events: AUD-IAM-011<br>• Story basis: D |
| Readiness | Ready |
| Acceptance Criteria | **AC-IAM-017-04-01** — **Given** GdprSettings.GdprEnabled is on, **when** the shopper chooses "Delete account" on the GDPR tools page, **then** the native flow logs DeleteCustomer in the GDPR log and sends Customer.Gdpr.DeleteRequest to the store owner, and a PrivacyRequest of type Deletion is opened with its due date. Basis: D; FIT (CustomerController.GdprToolsDelete)<br>**AC-IAM-017-04-02** — **Given** a deletion request is approved, **when** a user holding Customers.GDPRManage runs the native GDPR delete, **then** the IAM override of IGdprService.PermanentDeleteCustomerAsync also clears the personal fields that native code leaves (BR-IAM-092) and personal data in IAM plugin tables; orders and invoices are kept under the retention rules (PLT-020, SEC-012); AUD-IAM-011 is written. Basis: FIT (GdprService.PermanentDeleteCustomerAsync clears only Email, EmailToRevalidate and Username, Libraries/Nop.Services/Gdpr/GdprService.cs:258-351)<br>**AC-IAM-017-04-03** — **Given** modules that hold personal data in their own tables or send it to external services (for example SRC search history and the recommendation service, SRC-012, SRC-009) have registered an erasure provider (IC-IAM-08), **when** the IAM override of IGdprService.PermanentDeleteCustomerAsync runs, **then** each provider is called inside the same operation and reports Erased or Failed; a Failed provider leaves the PrivacyRequest InProgress with the provider named, and the request is not Completed (BR-IAM-092). Basis: Proposed |

**Use case US-IAM-017-05**

| Attribute | Description |
|---|---|
| User Story | As a privacy officer, I want each privacy request to be handled within the deadline for the country, with evidence, so that we meet our data-protection duties. |
| Use Case ID | US-IAM-017-05 |
| Use Case Name | Each privacy request to be handled within the deadline for the country, with evidence |
| Actor(s) | • Privacy officer<br>• Platform (IAM plugin)<br>• SEC-012 (Country data-protection pack) |
| Preconditions | • A privacy request is open. |
| Trigger | Its due date (from the country profile, SEC-012) is reached without completion. |
| Basic Flow | 1. Trigger: its due date (from the country profile, SEC-012) is reached without completion.<br>2. The system responds: it is marked Overdue and the privacy officer is notified (AC-IAM-017-05-01).<br>3. The user opens the privacy trail of a customer: consent changes, exports, correction and deletion requests are listed with dates and outcomes (AC-IAM-017-05-02). |
| Alternate Flows | Not stated in source |
| Exception Flow | Not stated in source |
| Postconditions | • Consent changes, exports, correction and deletion requests are listed with dates and outcomes (AC-IAM-017-05-02). |
| Business Rules | • BR-IAM-092 — Erasure completeness: the IAM override of IGdprService.PermanentDeleteCustomerAsync calls the native method and also clears Customer.FirstName, LastName, Gender, DateOfBirth, Company, StreetAddress, StreetAddress2, ZipPostalCode, City, County, Phone (and PhoneSmsVerified), Fax, VatNumber, CustomCustomerAttributesXML, LastIpAddress and AdminComment, and the personal data in IAM plugin tables (phone identity, sessions, verification results, preferences), and calls every erasure provider registered through IC-IAM-08<br>• BR-IAM-093 — Every privacy request (staff export, correction, deletion) gets a due date from the country profile (SEC-012) |
| Notes | • Permissions: Identity.Core.ConsentTrail.View<br>• Story basis: Inference from REQ-KTDA-LEG-001 (local data-protection law; law names are inference, DP-01); REQ-MPC-FR-022 |
| Readiness | Ready |
| Acceptance Criteria | **AC-IAM-017-05-01** — **Given** a privacy request is open, **when** its due date (from the country profile, SEC-012) is reached without completion, **then** it is marked Overdue and the privacy officer is notified. Basis: Inference from REQ-KTDA-LEG-001 (law names inference, DP-01)<br>**AC-IAM-017-05-02** — **Given** a user holds Identity.Core.ConsentTrail.View, **when** the user opens the privacy trail of a customer, **then** consent changes, exports, correction and deletion requests are listed with dates and outcomes. Basis: REQ-MPC-FR-022 |

**Use case US-IAM-017-06**

| Attribute | Description |
|---|---|
| User Story | As a KTDA analytics user, I want analytics data to be collected only with a lawful basis, so that our customer insights are lawful. |
| Use Case ID | US-IAM-017-06 |
| Use Case Name | Analytics data to be collected only with a lawful basis |
| Actor(s) | • KTDA analytics user<br>• Platform (IAM plugin)<br>• SEC-007 (Consent and privacy tools) |
| Preconditions | • A visitor has not accepted the analytics cookie category. |
| Trigger | Pages are shown. |
| Basic Flow | 1. Trigger: pages are shown.<br>2. The system responds: no analytics widget is rendered for that visitor and no analytics profile is built (SEC-007 gating) (AC-IAM-017-06-01). |
| Alternate Flows | Not stated in source |
| Exception Flow | Not stated in source |
| Postconditions | • No analytics widget is rendered for that visitor and no analytics profile is built (SEC-007 gating) (AC-IAM-017-06-01). |
| Business Rules | • BR-IAM-092 — Erasure completeness: the IAM override of IGdprService.PermanentDeleteCustomerAsync calls the native method and also clears Customer.FirstName, LastName, Gender, DateOfBirth, Company, StreetAddress, StreetAddress2, ZipPostalCode, City, County, Phone (and PhoneSmsVerified), Fax, VatNumber, CustomCustomerAttributesXML, LastIpAddress and AdminComment, and the personal data in IAM plugin tables (phone identity, sessions, verification results, preferences), and calls every erasure provider registered through IC-IAM-08<br>• BR-IAM-093 — Every privacy request (staff export, correction, deletion) gets a due date from the country profile (SEC-012) |
| Notes | • Story basis: REQ-KTDA-ANL-008 |
| Readiness | Ready |
| Acceptance Criteria | **AC-IAM-017-06-01** — **Given** a visitor has not accepted the analytics cookie category, **when** pages are shown, **then** no analytics widget is rendered for that visitor and no analytics profile is built (SEC-007 gating). Basis: REQ-KTDA-ANL-008 |

**Business rules applied:** BR-IAM-092; BR-IAM-093 (§8.1).


### 7.18 PRD-IAM-018 Account activity history

| Item | Value |
|---|---|
| Description (baseline) | Customers can see a list of recent logins, profile changes and payment attempts on their account. It also shows which staff members accessed their data. |
| Why it matters | Customers can spot suspicious activity themselves. |
| Who benefits | Shoppers |
| Phase | P1 |
| Implementation | Code-level — Custom plugin |
| Depends on | — |
| Status | Ready |

**Use case US-IAM-018-01**

| Attribute | Description |
|---|---|
| User Story | As a shopper, I want to see recent logins, important profile changes and payment attempts on my account, so that I can spot suspicious activity myself. |
| Use Case ID | US-IAM-018-01 |
| Use Case Name | To see recent logins, important profile changes and payment attempts on my account |
| Actor(s) | • Shopper<br>• Platform (IAM plugin)<br>• SEC-014 (Data classification and masking) |
| Preconditions | • A signed-in shopper. |
| Trigger | The shopper opens Account activity in My account. |
| Basic Flow | 1. Trigger: the shopper opens Account activity in My account.<br>2. The system responds: the page lists, newest first and for the configured look-back period: logins and failed logins (AuthEvent), changes to name, email, phone, password, MFA and addresses (field names, not values), and payment attempts with time, method and status (PAY PaymentTransaction) (AC-IAM-018-01-01).<br>3. They are shown to the shopper: the IP address is partly masked: when SEC-014 is delivered its masking rule applies; until then (P1) the last octet of an IPv4 address, or the last 80 bits of an IPv6 address, are replaced by zeros (Proposed) (AC-IAM-018-01-02). |
| Alternate Flows | Not stated in source |
| Exception Flow | Not stated in source |
| Postconditions | • The page lists, newest first and for the configured look-back period: logins and failed logins (AuthEvent), changes to name, email, phone, password, MFA and addresses (field names, not values), and payment attempts with time, method and status (PAY PaymentTransaction) (AC-IAM-018-01-01). |
| Business Rules | • BR-IAM-080 — Read-access logging: an IAM global action filter on admin actions that display one customer personal data (Customer Edit, Order Edit, customer address edit |
| Notes | • Story basis: D; REQ-MPC-FR-008 |
| Readiness | Ready |
| Acceptance Criteria | **AC-IAM-018-01-01** — **Given** a signed-in shopper, **when** the shopper opens Account activity in My account, **then** the page lists, newest first and for the configured look-back period: logins and failed logins (AuthEvent), changes to name, email, phone, password, MFA and addresses (field names, not values), and payment attempts with time, method and status (PAY PaymentTransaction). Basis: REQ-MPC-FR-008<br>**AC-IAM-018-01-02** — **Given** activity entries contain an IP address, **when** they are shown to the shopper, **then** the IP address is partly masked: when SEC-014 is delivered its masking rule applies; until then (P1) the last octet of an IPv4 address, or the last 80 bits of an IPv6 address, are replaced by zeros (Proposed). Basis: Proposed |

**Use case US-IAM-018-02**

| Attribute | Description |
|---|---|
| User Story | As a shopper, I want to see when staff accessed my data, so that I know who looked at my data. |
| Use Case ID | US-IAM-018-02 |
| Use Case Name | To see when staff accessed my data |
| Actor(s) | • Shopper<br>• Platform (IAM plugin)<br>• SEC-004 (Platform audit trail) |
| Preconditions | • Staff opened or changed the customer record, an order or an address of the customer (AUD-IAM-010, SEC-004). |
| Trigger | The shopper opens Account activity. |
| Basic Flow | 1. Trigger: the shopper opens Account activity.<br>2. The system responds: a "staff access" entry is shown with date and, as the setting says, the staff member name or role (AC-IAM-018-02-01). |
| Alternate Flows | Not stated in source |
| Exception Flow | Not stated in source |
| Postconditions | • A "staff access" entry is shown with date and, as the setting says, the staff member name or role (AC-IAM-018-02-01). |
| Business Rules | • BR-IAM-080 — Read-access logging: an IAM global action filter on admin actions that display one customer personal data (Customer Edit, Order Edit, customer address edit |
| Notes | • Audit events: AUD-IAM-010<br>• Story basis: D; FC-M06-028 |
| Readiness | Ready |
| Acceptance Criteria | **AC-IAM-018-02-01** — **Given** staff opened or changed the customer record, an order or an address of the customer (AUD-IAM-010, SEC-004), **when** the shopper opens Account activity, **then** a "staff access" entry is shown with date and, as the setting says, the staff member name or role. Basis: D; FC-M06-028 |

**Use case US-IAM-018-03**

| Attribute | Description |
|---|---|
| User Story | As an authorised administrator, I want to see the same history for a customer, so that I can help with account concerns. |
| Use Case ID | US-IAM-018-03 |
| Use Case Name | To see the same history for a customer |
| Actor(s) | • Authorised administrator<br>• Platform (IAM plugin) |
| Preconditions | • A user holds Customers.CustomersView. |
| Trigger | The user opens the customer in admin. |
| Basic Flow | 1. Trigger: the user opens the customer in admin.<br>2. The system responds: an Account activity tab shows the same entries (AC-IAM-018-03-01). |
| Alternate Flows | Not stated in source |
| Exception Flow | Not stated in source |
| Postconditions | • An Account activity tab shows the same entries (AC-IAM-018-03-01). |
| Business Rules | • BR-IAM-080 — Read-access logging: an IAM global action filter on admin actions that display one customer personal data (Customer Edit, Order Edit, customer address edit |
| Notes | • Permissions: Customers.CustomersView<br>• Story basis: REQ-MPC-FR-008 |
| Readiness | Ready |
| Acceptance Criteria | **AC-IAM-018-03-01** — **Given** a user holds Customers.CustomersView, **when** the user opens the customer in admin, **then** an Account activity tab shows the same entries. Basis: REQ-MPC-FR-008 |

**Business rules applied:** BR-IAM-080 (§8.1).


### 7.19 PRD-IAM-019 Account synchronisation with core systems

| Item | Value |
|---|---|
| Description (baseline) | Keeps customer accounts in step with Malawi Post's other internal systems. |
| Why it matters | Avoids duplicate or conflicting customer records across Malawi Post systems. |
| Who benefits | Malawi Post |
| Phase | P1 |
| Implementation | Code-level — External system + integration plugin |
| Depends on | — |
| Status | Ready |

**Use case US-IAM-019-01**

| Attribute | Description |
|---|---|
| User Story | As a Malawi Post integration manager, I want customer accounts kept in step with our other internal systems through the Integration Layer, so that there are no duplicate or conflicting customer records. |
| Use Case ID | US-IAM-019-01 |
| Use Case Name | Customer accounts kept in step with our other internal systems through the Integration Layer |
| Actor(s) | • Malawi Post integration manager<br>• Platform (IAM plugin)<br>• INT-004 (Integration health and retries) |
| Preconditions | • Synchronisation is enabled for a set of fields. |
| Trigger | A customer is registered, updated, deactivated or deleted. |
| Basic Flow | 1. Trigger: a customer is registered, updated, deactivated or deleted.<br>2. The system responds: an IntegrationMessage with channel "account sync" is written to the INT-004 outbox through IC-INT-09 Enqueue (the IAM event consumer for CustomerRegisteredEvent and EntityInsertedEvent / EntityUpdatedEvent of Customer only enqueues, BR-INT-010) and the INT delivery task sends it to the Integration Layer adapter (IC-IAM-03 PublishAccountChange) (AC-IAM-019-01-01).<br>3. The INT-004 retry policy applies: the message is retried (SM-INT-01); after the last retry it becomes DeadLettered and appears in the INT dead-letter list (Integrations.Core.Messages.View); IAM keeps no outbox of its own (BR-IAM-100) (AC-IAM-019-01-02).<br>4. It is processed: only the configured fields are updated; if the platform value changed after the core-system version, the configured system of record wins and the conflict is logged (AC-IAM-019-01-03).<br>5. The deletion completes: the core system receives an erasure notice for that customer (AC-IAM-019-01-04). |
| Alternate Flows | Not stated in source |
| Exception Flow | Not stated in source |
| Postconditions | • The message is retried (SM-INT-01); after the last retry it becomes DeadLettered and appears in the INT dead-letter list (Integrations.Core.Messages.View); IAM keeps no outbox of its own (BR-IAM-100) (AC-IAM-019-01-02). |
| Business Rules | • BR-IAM-100 — Account synchronisation uses the single INT-004 outbox (IntegrationMessage, SM-INT-01): IAM event consumers only write outbox messages with channel "account sync" through IC-INT-09 Enqueue |
| Notes | • Contracts: IC-IAM-03, IC-INT-09<br>• State models: SM-INT-01<br>• Story basis: D; REQ-MPC-FR-020 |
| Readiness | Ready |
| Acceptance Criteria | **AC-IAM-019-01-01** — **Given** synchronisation is enabled for a set of fields, **when** a customer is registered, updated, deactivated or deleted, **then** an IntegrationMessage with channel "account sync" is written to the INT-004 outbox through IC-INT-09 Enqueue (the IAM event consumer for CustomerRegisteredEvent and EntityInsertedEvent / EntityUpdatedEvent of Customer only enqueues, BR-INT-010) and the INT delivery task sends it to the Integration Layer adapter (IC-IAM-03 PublishAccountChange). Basis: REQ-MPC-FR-020; FIT<br>**AC-IAM-019-01-02** — **Given** sending fails, **when** the INT-004 retry policy applies, **then** the message is retried (SM-INT-01); after the last retry it becomes DeadLettered and appears in the INT dead-letter list (Integrations.Core.Messages.View); IAM keeps no outbox of its own (BR-IAM-100). Basis: REQ-MPC-FR-020<br>**AC-IAM-019-01-03** — **Given** an inbound change arrives from a core system, **when** it is processed, **then** only the configured fields are updated; if the platform value changed after the core-system version, the configured system of record wins and the conflict is logged. Basis: REQ-MPC-FR-020; Proposed (system of record)<br>**AC-IAM-019-01-04** — **Given** a customer is deleted under IAM-017, **when** the deletion completes, **then** the core system receives an erasure notice for that customer. Basis: Proposed |

**Business rules applied:** BR-IAM-100; BR-IAM-140 (§8.1).


### 7.20 PRD-IAM-020 Identity verification adapter framework

| Item | Value |
|---|---|
| Description (baseline) | A common connector that checks identity details (national ID, tax number, mobile-money registration) against official or telecom sources, with a separate adapter for each country. |
| Why it matters | Confirms buyers and sellers are who they say they are, and adds new countries without rebuilding. |
| Who benefits | Clients; compliance staff |
| Phase | P1 |
| Implementation | External system — External system + integration plugin |
| Depends on | — |
| Status | Ready |

**Use case US-IAM-020-01**

| Attribute | Description |
|---|---|
| User Story | As a compliance officer, I want identity details checked against official or mobile-network sources where a process requires KYC, so that buyers and sellers are who they say they are. |
| Use Case ID | US-IAM-020-01 |
| Use Case Name | Identity details checked against official or mobile-network sources where a process requires KYC |
| Actor(s) | • Compliance officer<br>• Platform (IAM plugin)<br>• AI-005 (OCR and ID document checks)<br>• SEL-004 (Identity and registry verification adapters) |
| Preconditions | • A mobile-money KYC adapter is available. |
| Trigger | A person chooses to verify with the mobile number. |
| Basic Flow | 1. Trigger: a person chooses to verify with the mobile number.<br>2. The system responds: the adapter returns the match result from the mobile-money registration and it is recorded as above (AC-IAM-020-01-02).<br>3. The result is recorded: the case goes to the manual review queue; a user holding Identity.Core.Verification.CreateEditDelete decides it with a reason (AUD-IAM-015) (AC-IAM-020-01-03).<br>4. The case is decided: the AI output is shown to the reviewer as a suggestion only; the result Verified or NotVerified is set by the adapter or by a reviewer holding Identity.Core.Verification.CreateEditDelete, never by the AI output alone (BR-AI-002, BR-IAM-110) (AC-IAM-020-01-05). |
| Alternate Flows | Not stated in source |
| Exception Flow | • A process is configured to require KYC: when a person submits an identity type and number, the framework calls the adapter for the country (IC-IAM-02) and records the result Verified, NotVerified, Inconclusive or Unavailable with the adapter reference and time; identity document images are not stored by the framework (BR-IAM-110) (AC-IAM-020-01-01).<br>• SEL-004 calls IC-IAM-02 Verify for a seller (check type, country, identifier, name): when the adapter answers, the result is returned as Verified, NotVerified, Inconclusive or Unavailable with the adapter reference (the product standard values, owner decision); SEL stores its own copy and handles Inconclusive as manual review under its own maker-checker rule (BR-SEL-007); IAM opens no manual review case for checks requested by SEL (AC-IAM-020-01-04). |
| Postconditions | • The adapter returns the match result from the mobile-money registration and it is recorded as above (AC-IAM-020-01-02). |
| Business Rules | • BR-IAM-110 — Identity verification stores the result, adapter, reference, time and the fields matched, not identity document images |
| Notes | • Permissions: Identity.Core.Verification.CreateEditDelete<br>• Contracts: IC-IAM-02<br>• Audit events: AUD-IAM-015<br>• Story basis: D; REQ-MPC-FR-344 |
| Readiness | Ready |
| Acceptance Criteria | **AC-IAM-020-01-01** — **Given** a process is configured to require KYC, **when** a person submits an identity type and number, **then** the framework calls the adapter for the country (IC-IAM-02) and records the result Verified, NotVerified, Inconclusive or Unavailable with the adapter reference and time; identity document images are not stored by the framework (BR-IAM-110). Basis: REQ-MPC-FR-344<br>**AC-IAM-020-01-02** — **Given** a mobile-money KYC adapter is available, **when** a person chooses to verify with the mobile number, **then** the adapter returns the match result from the mobile-money registration and it is recorded as above. Basis: REQ-MPC-FR-344 ("leveraging existing mobile-money KYC where feasible")<br>**AC-IAM-020-01-03** — **Given** the adapter returns Unavailable or Inconclusive, **when** the result is recorded, **then** the case goes to the manual review queue; a user holding Identity.Core.Verification.CreateEditDelete decides it with a reason (AUD-IAM-015). Basis: Proposed<br>**AC-IAM-020-01-04** — **Given** SEL-004 calls IC-IAM-02 Verify for a seller (check type, country, identifier, name), **when** the adapter answers, **then** the result is returned as Verified, NotVerified, Inconclusive or Unavailable with the adapter reference (the product standard values, owner decision); SEL stores its own copy and handles Inconclusive as manual review under its own maker-checker rule (BR-SEL-007); IAM opens no manual review case for checks requested by SEL. Basis: REQ-MPC-FR-344<br>**AC-IAM-020-01-05** — **Given** OCR or an ID-document check of AI-005 has produced extracted fields or a match score for a case, **when** the case is decided, **then** the AI output is shown to the reviewer as a suggestion only; the result Verified or NotVerified is set by the adapter or by a reviewer holding Identity.Core.Verification.CreateEditDelete, never by the AI output alone (BR-AI-002, BR-IAM-110). Basis: Proposed ( AI-005; BR-AI-002) |

**Use case US-IAM-020-02**

| Attribute | Description |
|---|---|
| User Story | Technical enabler. As a member of the platform team, I want each country to connect through its own adapter on one framework, so that a new country is added without rebuilding. |
| Use Case ID | US-IAM-020-02 |
| Use Case Name | Each country to connect through its own adapter on one framework |
| Actor(s) | • Member of the platform team<br>• Platform (IAM plugin) |
| Preconditions | • A new adapter implements IC-IAM-02. |
| Trigger | It is installed and configured for a country. |
| Basic Flow | 1. Trigger: it is installed and configured for a country.<br>2. The system responds: it is used for that country without change to the framework (AC-IAM-020-02-01). |
| Alternate Flows | Not stated in source |
| Exception Flow | Not stated in source |
| Postconditions | • It is used for that country without change to the framework (AC-IAM-020-02-01). |
| Business Rules | • BR-IAM-110 — Identity verification stores the result, adapter, reference, time and the fields matched, not identity document images<br>• BR-IAM-140 — Key catalogue: every new IAM setting key is listed in the IAM plugin key catalogue with key, type, layer, secret flag and default (NFR-X-008) |
| Notes | • Contracts: IC-IAM-02<br>• Story basis: D |
| Readiness | Ready |
| Acceptance Criteria | **AC-IAM-020-02-01** — **Given** a new adapter implements IC-IAM-02, **when** it is installed and configured for a country, **then** it is used for that country without change to the framework. Basis: D |

**Business rules applied:** BR-IAM-110; BR-IAM-140 (§8.1).


### 7.21 PRD-IAM-021 Customer transaction history

| Item | Value |
|---|---|
| Description (baseline) | Customers see all their past orders, invoices, quotes and returns, and can download or export them. |
| Why it matters | Customers keep their own records and need less help from support. |
| Who benefits | Shoppers; business buyers |
| Phase | P1 |
| Implementation | Code-level — Custom plugin + Theme/view override |
| Depends on | — |
| Status | Ready |

**Use case US-IAM-021-01**

| Attribute | Description |
|---|---|
| User Story | As a shopper, I want to see my past orders with status, items, totals and tracking references, so that I can follow and check my orders. |
| Use Case ID | US-IAM-021-01 |
| Use Case Name | To see my past orders with status, items, totals and tracking references |
| Actor(s) | • Shopper<br>• Platform (IAM plugin) |
| Preconditions | • A customer has orders. |
| Trigger | The customer opens Orders in My account. |
| Basic Flow | 1. Trigger: the customer opens Orders in My account.<br>2. The system responds: each order is listed with number, date, status and total; the details page shows items, totals and shipments with tracking numbers (AC-IAM-021-01-01). |
| Alternate Flows | Not stated in source |
| Exception Flow | Not stated in source |
| Postconditions | • Each order is listed with number, date, status and total; the details page shows items, totals and shipments with tracking numbers (AC-IAM-021-01-01). |
| Business Rules | Not stated in source |
| Notes | • Story basis: D; REQ-MPC-FR-151 |
| Readiness | Ready |
| Acceptance Criteria | **AC-IAM-021-01-01** — **Given** a customer has orders, **when** the customer opens Orders in My account, **then** each order is listed with number, date, status and total; the details page shows items, totals and shipments with tracking numbers. Basis: REQ-MPC-FR-151; FIT (OrderController.CustomerOrders) |

**Use case US-IAM-021-02**

| Attribute | Description |
|---|---|
| User Story | As a shopper, I want to view and download receipts and invoices for my orders, so that I keep my own records. |
| Use Case ID | US-IAM-021-02 |
| Use Case Name | To view and download receipts and invoices for my orders |
| Actor(s) | • Shopper<br>• Platform (IAM plugin) |
| Preconditions | • An order details page. |
| Trigger | The customer chooses the PDF invoice. |
| Basic Flow | 1. Trigger: the customer chooses the PDF invoice.<br>2. The system responds: the native PDF invoice is downloaded (AC-IAM-021-02-01). |
| Alternate Flows | Not stated in source |
| Exception Flow | Not stated in source |
| Postconditions | • The native PDF invoice is downloaded (AC-IAM-021-02-01). |
| Business Rules | Not stated in source |
| Notes | • Story basis: REQ-MPC-FR-007 |
| Readiness | Ready |
| Acceptance Criteria | **AC-IAM-021-02-01** — **Given** an order details page, **when** the customer chooses the PDF invoice, **then** the native PDF invoice is downloaded. Basis: REQ-MPC-FR-007; FIT (OrderController.GetPdfInvoice) |

**Use case US-IAM-021-03**

| Attribute | Description |
|---|---|
| User Story | As a business buyer, I want to see my quotes and returns and export my history to a spreadsheet, so that I can work with it offline. |
| Use Case ID | US-IAM-021-03 |
| Use Case Name | To see my quotes and returns and export my history to a spreadsheet |
| Actor(s) | • Business buyer<br>• Platform (IAM plugin) |
| Preconditions | • The bundled Misc.RFQ plugin is active and the customer has quotes or return requests. |
| Trigger | The customer opens My account. |
| Basic Flow | 1. Trigger: the customer opens My account.<br>2. The system responds: quotes and return requests are listed in their own pages (AC-IAM-021-03-01).<br>3. The customer chooses Export: a CSV or XLSX file of the filtered list is downloaded (AC-IAM-021-03-02). |
| Alternate Flows | Not stated in source |
| Exception Flow | Not stated in source |
| Postconditions | • A CSV or XLSX file of the filtered list is downloaded (AC-IAM-021-03-02). |
| Business Rules | Not stated in source |
| Notes | • Story basis: D; FC-M06-027 |
| Readiness | Ready |
| Acceptance Criteria | **AC-IAM-021-03-01** — **Given** the bundled Misc.RFQ plugin is active and the customer has quotes or return requests, **when** the customer opens My account, **then** quotes and return requests are listed in their own pages. Basis: FIT (CustomerRfqMenuComponent; ReturnRequestController.CustomerReturnRequests)<br>**AC-IAM-021-03-02** — **Given** the customer filters the history by type, date range, status and value, **when** the customer chooses Export, **then** a CSV or XLSX file of the filtered list is downloaded. Basis: D; FC-M06-027<br>**AC-IAM-021-03-03** — **Given** the bundled Misc.RFQ plugin is active with RfqSettings.AllowCustomerGenerateQuotePdf on, **when** the customer opens a quote in My account and chooses the PDF, **then** the native quote PDF is downloaded; with the setting off no PDF is offered (setting default off). Basis: D; FIT (Plugins/Nop.Plugin.Misc.RFQ/Controllers/RfqCustomerController.cs:458-461; RfqPlugin.cs:111); VER-500 |

**Use case US-IAM-021-04**

| Attribute | Description |
|---|---|
| User Story | As a returning shopper, I want to order again from a past order, so that repeat purchase is quick. |
| Use Case ID | US-IAM-021-04 |
| Use Case Name | To order again from a past order |
| Actor(s) | • Returning shopper<br>• Platform (IAM plugin) |
| Preconditions | • OrderSettings.IsReOrderAllowed is on. |
| Trigger | The customer chooses Re-order on a past order. |
| Basic Flow | 1. Trigger: the customer chooses Re-order on a past order.<br>2. The system responds: the items of that order are added to the basket (AC-IAM-021-04-01). |
| Alternate Flows | Not stated in source |
| Exception Flow | Not stated in source |
| Postconditions | • The items of that order are added to the basket (AC-IAM-021-04-01). |
| Business Rules | Not stated in source |
| Notes | • Story basis: REQ-KTDA-CUS-005 |
| Readiness | Ready |
| Acceptance Criteria | **AC-IAM-021-04-01** — **Given** OrderSettings.IsReOrderAllowed is on, **when** the customer chooses Re-order on a past order, **then** the items of that order are added to the basket. Basis: REQ-KTDA-CUS-005; FIT |

**Business rules applied:** none specific to this feature (§8.1 lists the module rules).


### 7.22 PRD-IAM-022 B2B company accounts

| Item | Value |
|---|---|
| Description (baseline) | A company account with several staff users who share addresses and order history, each with a role such as buyer, approver or company administrator. |
| Why it matters | Lets organisations buy as a team with proper control. |
| Who benefits | Business buyers |
| Phase | P1 |
| Implementation | Code-level — Custom plugin + Theme/view override |
| Depends on | — |
| Status | On hold: PH-INF |

**Use case US-IAM-022-01**

| Attribute | Description |
|---|---|
| User Story | As a business buyer, I want a company account where several of our staff share addresses and order history, so that we buy as a team. |
| Use Case ID | US-IAM-022-01 |
| Use Case Name | A company account where several of our staff share addresses and order history |
| Actor(s) | • Business buyer<br>• Platform (IAM plugin)<br>• CAT-040 (Company-specific assortment)<br>• CHK-016 (B2B on-account payment and credit limits)<br>• CHK-018 (B2B purchase approval) |
| Preconditions | • Company C has members. |
| Trigger | A member places an order. |
| Basic Flow | 1. Trigger: a member places an order.<br>2. The system responds: the order is linked to C and visible to members with the view right; the shared company addresses are offered at checkout (AC-IAM-022-01-01).<br>3. It calls IC-IAM-07 GetCompanyOfCustomer: it receives the CompanyId, the company status and the company role of the customer, or "no company" (AC-IAM-022-01-03). |
| Alternate Flows | Not stated in source |
| Exception Flow | • A customer is not a member of C: when the customer opens an order of C by its address, access is denied (AC-IAM-022-01-02). |
| Postconditions | • The order is linked to C and visible to members with the view right; the shared company addresses are offered at checkout (AC-IAM-022-01-01). |
| Business Rules | • BR-IAM-120 — Company membership and company roles (buyer, approver, company administrator) are kept in IAM plugin tables per company, not as nopCommerce customer roles<br>• BR-IAM-141 — Feature state: IAM features that are not always on (IAM-005, IAM-009, IAM-013, IAM-022, IAM-023, IAM-025, IAM-026, IAM-027) check IC-PLT-02 IsEnabled for the store before showing pages or widgets, running filters or scheduled work |
| Notes | • Contracts: IC-IAM-07<br>• Story basis: D; Inference from REQ-KTDA-CUS-002 (B2B buyers; PH-INF) |
| Readiness | On hold: PH-INF |
| Acceptance Criteria | **AC-IAM-022-01-01** — **Given** company C has members, **when** a member places an order, **then** the order is linked to C and visible to members with the view right; the shared company addresses are offered at checkout. Basis: D; Inference from REQ-KTDA-CUS-002 (PH-INF)<br>**AC-IAM-022-01-02** — **Given** a customer is not a member of C, **when** the customer opens an order of C by its address, **then** access is denied. Basis: Proposed<br>**AC-IAM-022-01-03** — **Given** another module needs the company of a customer (for example CAT-040 assortments, CHK-016 credit, CHK-018 approvals), **when** it calls IC-IAM-07 GetCompanyOfCustomer, **then** it receives the CompanyId, the company status and the company role of the customer, or "no company". Basis: Proposed |

**Use case US-IAM-022-02**

| Attribute | Description |
|---|---|
| User Story | As a company administrator, I want to give each member a company role such as buyer, approver or company administrator, so that each person does only their part. |
| Use Case ID | US-IAM-022-02 |
| Use Case Name | To give each member a company role such as buyer, approver or company administrator |
| Actor(s) | • Company administrator<br>• Platform (IAM plugin)<br>• CAT-040 (Company-specific assortment)<br>• CHK-018 (B2B purchase approval) |
| Preconditions | • A company administrator. |
| Trigger | The administrator adds a member by email invitation and gives a company role. |
| Basic Flow | 1. Trigger: the administrator adds a member by email invitation and gives a company role.<br>2. The system responds: the member gets the rights of that role in C: buyer orders, approver approves (CHK-018), company administrator manages members (BR-IAM-120) (AC-IAM-022-02-01).<br>3. The change is saved: the member loses access to C data; orders the member placed stay with C (AC-IAM-022-02-02).<br>4. A buyer of C submits a cart above the threshold of the buyer role: CHK-018 reads the company role of the buyer through IC-IAM-07; thresholds are stored by CHK-018, not by IAM (BR-IAM-120) (AC-IAM-022-02-04). |
| Alternate Flows | Not stated in source |
| Exception Flow | • CAT-040 (P2) is delivered, has registered a membership provider and created the per-company system customer role of C (before CAT-040 no provider is registered and membership changes call none): when a member is added to or removed from C, IAM calls the provider (IC-IAM-07 OnMembershipChanged) inside the same save, so CAT adds or removes the mapping of the member to that role through ICustomerService; if the provider fails the membership change is not saved (AC-IAM-022-02-03). |
| Postconditions | • CHK-018 reads the company role of the buyer through IC-IAM-07; thresholds are stored by CHK-018, not by IAM (BR-IAM-120) (AC-IAM-022-02-04). |
| Business Rules | • BR-IAM-120 — Company membership and company roles (buyer, approver, company administrator) are kept in IAM plugin tables per company, not as nopCommerce customer roles |
| Notes | • Contracts: IC-IAM-07<br>• Story basis: D; FC-M06-017 |
| Readiness | On hold: PH-INF |
| Acceptance Criteria | **AC-IAM-022-02-01** — **Given** a company administrator, **when** the administrator adds a member by email invitation and gives a company role, **then** the member gets the rights of that role in C: buyer orders, approver approves (CHK-018), company administrator manages members (BR-IAM-120). Basis: D; FC-M06-017<br>**AC-IAM-022-02-02** — **Given** a member is removed from C, **when** the change is saved, **then** the member loses access to C data; orders the member placed stay with C. Basis: Proposed<br>**AC-IAM-022-02-03** — **Given** CAT-040 (P2) is delivered, has registered a membership provider and created the per-company system customer role of C (before CAT-040 no provider is registered and membership changes call none), **when** a member is added to or removed from C, **then** IAM calls the provider (IC-IAM-07 OnMembershipChanged) inside the same save, so CAT adds or removes the mapping of the member to that role through ICustomerService; if the provider fails the membership change is not saved. Basis: Proposed<br>**AC-IAM-022-02-04** — **Given** approval thresholds are set per company role (CHK-018), **when** a buyer of C submits a cart above the threshold of the buyer role, **then** CHK-018 reads the company role of the buyer through IC-IAM-07; thresholds are stored by CHK-018, not by IAM (BR-IAM-120). Basis: D; FC-M06-017 |

**Business rules applied:** BR-IAM-120; BR-IAM-141 (§8.1).


### 7.23 PRD-IAM-023 B2B buyer registration and approval

| Item | Value |
|---|---|
| Description (baseline) | Businesses apply for a trade account by giving company details, VAT or tax number and documents; the client approves them before trade prices are shown. |
| Why it matters | Trade prices and terms go only to verified businesses. |
| Who benefits | Business buyers; client sales staff |
| Phase | P1 |
| Implementation | Code-level — Custom plugin + Theme/view override |
| Depends on | — |
| Status | On hold: PH-INF |

**Use case US-IAM-023-01**

| Attribute | Description |
|---|---|
| User Story | As a business, I want to apply for a trade account with company details, tax number and documents, so that we can buy at trade terms. |
| Use Case ID | US-IAM-023-01 |
| Use Case Name | To apply for a trade account with company details, tax number and documents |
| Actor(s) | • Business<br>• Platform (IAM plugin)<br>• ADM-008 (Upload and content scanning controls) |
| Preconditions | • The trade application form is configured. |
| Trigger | A business submits company name, registration number, tax or VAT number and the required documents. |
| Basic Flow | 1. Trigger: a business submits company name, registration number, tax or VAT number and the required documents.<br>2. The system responds: a TradeApplication is created as Received with the files stored as Download records (native customer attributes do not support file upload) and message Iam.TradeApplicationReceived is shown (AC-IAM-023-01-01). |
| Alternate Flows | Not stated in source |
| Exception Flow | • A document attached to the application has a file type or size outside the ADM-008 upload policy of the context "trade application document" (registered by IAM at installation through IC-ADM-08 RegisterUploadContext; IAM checks each file through IC-ADM-08 CheckUpload before storing it): when the form is posted, the file is refused by the ADM-008 policy before anything is stored (BR-ADM-060); IAM adds no type or size check of its own (AC-IAM-023-01-02). |
| Postconditions | • A TradeApplication is created as Received with the files stored as Download records (native customer attributes do not support file upload) and message Iam.TradeApplicationReceived is shown (AC-IAM-023-01-01). |
| Business Rules | • BR-IAM-120 — Company membership and company roles (buyer, approver, company administrator) are kept in IAM plugin tables per company, not as nopCommerce customer roles<br>• BR-IAM-141 — Feature state: IAM features that are not always on (IAM-005, IAM-009, IAM-013, IAM-022, IAM-023, IAM-025, IAM-026, IAM-027) check IC-PLT-02 IsEnabled for the store before showing pages or widgets, running filters or scheduled work |
| Notes | • Messages and templates: Iam.TradeApplicationReceived<br>• Contracts: IC-ADM-08<br>• Story basis: D; Inference from REQ-KTDA-CUS-002 (B2B buyers; PH-INF) |
| Readiness | On hold: PH-INF |
| Acceptance Criteria | **AC-IAM-023-01-01** — **Given** the trade application form is configured, **when** a business submits company name, registration number, tax or VAT number and the required documents, **then** a TradeApplication is created as Received with the files stored as Download records (native customer attributes do not support file upload) and message Iam.TradeApplicationReceived is shown. Basis: D; FIT (CustomerAttribute excludes FileUpload); Inference from REQ-KTDA-CUS-002 (PH-INF)<br>**AC-IAM-023-01-02** — **Given** a document attached to the application has a file type or size outside the ADM-008 upload policy of the context "trade application document" (registered by IAM at installation through IC-ADM-08 RegisterUploadContext; IAM checks each file through IC-ADM-08 CheckUpload before storing it), **when** the form is posted, **then** the file is refused by the ADM-008 policy before anything is stored (BR-ADM-060); IAM adds no type or size check of its own. Basis: Proposed (owner decision: ADM-008 single owner of upload policy) |

**Use case US-IAM-023-02**

| Attribute | Description |
|---|---|
| User Story | As a client sales staff member, I want to approve applications before trade prices are shown, so that trade terms go only to checked businesses. |
| Use Case ID | US-IAM-023-02 |
| Use Case Name | To approve applications before trade prices are shown |
| Actor(s) | • Client sales staff member<br>• Platform (IAM plugin) |
| Preconditions | • A user holds Identity.Core.TradeAccounts.CreateEditDelete. |
| Trigger | The user approves an application. |
| Basic Flow | 1. Trigger: the user approves an application.<br>2. The system responds: the customer gets the TradeBuyer role, a company account is created (IAM-022), trade prices limited to that role (tier prices by CustomerRoleId, ACL) become visible and the applicant receives message template Iam.TradeApplicationApproved.CustomerNotification (AUD-IAM-013) (AC-IAM-023-02-01).<br>3. The decision is saved: the applicant is told the reason; no role is given (SM-IAM-07) (AC-IAM-023-02-02).<br>4. The applicant browses: trade prices are not shown (AC-IAM-023-02-03). |
| Alternate Flows | Not stated in source |
| Exception Flow | Not stated in source |
| Postconditions | • The customer gets the TradeBuyer role, a company account is created (IAM-022), trade prices limited to that role (tier prices by CustomerRoleId, ACL) become visible and the applicant receives message template Iam.TradeApplicationApproved.CustomerNotification (AUD-IAM-013) (AC-IAM-023-02-01). |
| Business Rules | • BR-IAM-120 — Company membership and company roles (buyer, approver, company administrator) are kept in IAM plugin tables per company, not as nopCommerce customer roles<br>• BR-IAM-141 — Feature state: IAM features that are not always on (IAM-005, IAM-009, IAM-013, IAM-022, IAM-023, IAM-025, IAM-026, IAM-027) check IC-PLT-02 IsEnabled for the store before showing pages or widgets, running filters or scheduled work |
| Notes | • Messages and templates: Iam.TradeApplicationApproved.CustomerNotification<br>• Permissions: Identity.Core.TradeAccounts.CreateEditDelete<br>• State models: SM-IAM-07<br>• Audit events: AUD-IAM-013<br>• Story basis: D |
| Readiness | On hold: PH-INF |
| Acceptance Criteria | **AC-IAM-023-02-01** — **Given** a user holds Identity.Core.TradeAccounts.CreateEditDelete, **when** the user approves an application, **then** the customer gets the TradeBuyer role, a company account is created (IAM-022), trade prices limited to that role (tier prices by CustomerRoleId, ACL) become visible and the applicant receives message template Iam.TradeApplicationApproved.CustomerNotification (AUD-IAM-013). Basis: D; FIT (TierPrice.CustomerRoleId)<br>**AC-IAM-023-02-02** — **Given** an application is rejected with a reason or more information is requested, **when** the decision is saved, **then** the applicant is told the reason; no role is given (SM-IAM-07). Basis: Proposed<br>**AC-IAM-023-02-03** — **Given** an application is still Received, **when** the applicant browses, **then** trade prices are not shown. Basis: D |

**Business rules applied:** BR-IAM-120; BR-IAM-141 (§8.1).


### 7.24 PRD-IAM-024 Tax-exempt and VAT-registered buyers

| Item | Value |
|---|---|
| Description (baseline) | Marks certain customers or groups as tax-exempt or VAT-registered and records their VAT number. |
| Why it matters | Correct tax is charged on business sales. |
| Who benefits | Business buyers; finance staff |
| Phase | P1 |
| Implementation | Configuration — None |
| Depends on | — |
| Status | Ready |

**Use case US-IAM-024-01**

| Attribute | Description |
|---|---|
| User Story | As a member of finance staff, I want to mark customers or customer groups as tax-exempt, so that tax is charged correctly on business sales. |
| Use Case ID | US-IAM-024-01 |
| Use Case Name | To mark customers or customer groups as tax-exempt |
| Actor(s) | • Member of finance staff<br>• Platform (IAM plugin)<br>• SEC-004 (Platform audit trail) |
| Preconditions | • Customer.IsTaxExempt or the TaxExempt flag of one of the customer roles is on. |
| Trigger | An order is calculated. |
| Basic Flow | 1. Trigger: an order is calculated.<br>2. The system responds: no tax is added to the lines (native tax calculation) (AC-IAM-024-01-01).<br>3. The exemption flag is set on the customer: the exemption applies from the next calculation and the change is audited (SEC-004) — held by PH-INF (KTDA B2B by inference) (AC-IAM-024-01-02). |
| Alternate Flows | Not stated in source |
| Exception Flow | Not stated in source |
| Postconditions | • The exemption applies from the next calculation and the change is audited (SEC-004) — held by PH-INF (KTDA B2B by inference) (AC-IAM-024-01-02). |
| Business Rules | • BR-IAM-121 — Where TaxSettings.EuVatEnabled is switched on to record VAT numbers, EuVatUseWebService and EuVatAllowVatExemption stay off and Country.SubjectToVat is set deliberately for every country, because native IsVatExemptAsync exempts addresses in countries not subject to VAT |
| Notes | • Messages and templates: Customer.IsTaxExempt<br>• Story basis: D; REQ-KTDA-TAX-001 |
| Readiness | Ready; on hold: AC-IAM-024-01-02 (PH-INF) |
| Acceptance Criteria | **AC-IAM-024-01-01** — **Given** Customer.IsTaxExempt or the TaxExempt flag of one of the customer roles is on, **when** an order is calculated, **then** no tax is added to the lines (native tax calculation). Basis: REQ-KTDA-TAX-001; FIT<br>**AC-IAM-024-01-02** — **Given** a trade buyer is approved as tax-exempt on evidence (IAM-023), **when** the exemption flag is set on the customer, **then** the exemption applies from the next calculation and the change is audited (SEC-004) — held by PH-INF (KTDA B2B by inference). Basis: Inference from REQ-KTDA-CUS-002 (B2B buyers; PH-INF) |

**Use case US-IAM-024-02**

| Attribute | Description |
|---|---|
| User Story | As a business buyer, I want to record my VAT number, so that my invoices show it. |
| Use Case ID | US-IAM-024-02 |
| Use Case Name | To record my VAT number |
| Actor(s) | • Business buyer<br>• Platform (IAM plugin) |
| Preconditions | • TaxSettings.EuVatEnabled is switched on so that the VAT number field is shown. |
| Trigger | The configuration is checked. |
| Basic Flow | 1. Trigger: the configuration is checked.<br>2. The system responds: EuVatUseWebService and EuVatAllowVatExemption are off and Country.SubjectToVat is reviewed for every country, because the native EU logic exempts addresses in countries not subject to VAT (BR-IAM-121) (AC-IAM-024-02-01).<br>3. Staff review it: staff mark it valid or invalid with the native actions (MarkVatNumberAsValid / Invalid) (AC-IAM-024-02-02). |
| Alternate Flows | Not stated in source |
| Exception Flow | Not stated in source |
| Postconditions | • Staff mark it valid or invalid with the native actions (MarkVatNumberAsValid / Invalid) (AC-IAM-024-02-02). |
| Business Rules | • BR-IAM-121 — Where TaxSettings.EuVatEnabled is switched on to record VAT numbers, EuVatUseWebService and EuVatAllowVatExemption stay off and Country.SubjectToVat is set deliberately for every country, because native IsVatExemptAsync exempts addresses in countries not subject to VAT |
| Notes | • Story basis: D |
| Readiness | Ready |
| Acceptance Criteria | **AC-IAM-024-02-01** — **Given** TaxSettings.EuVatEnabled is switched on so that the VAT number field is shown, **when** the configuration is checked, **then** EuVatUseWebService and EuVatAllowVatExemption are off and Country.SubjectToVat is reviewed for every country, because the native EU logic exempts addresses in countries not subject to VAT (BR-IAM-121). Basis: FIT (TaxService.IsVatExemptAsync)<br>**AC-IAM-024-02-02** — **Given** a buyer enters a VAT number, **when** staff review it, **then** staff mark it valid or invalid with the native actions (MarkVatNumberAsValid / Invalid). Basis: FIT |

**Business rules applied:** BR-IAM-121 (§8.1).


### 7.25 PRD-IAM-025 Customer home dashboard

| Item | Value |
|---|---|
| Description (baseline) | A personal home page after login showing open orders, quotes, things waiting for the customer and recent messages. It also has a quick-action menu on every screen (for example place an order, raise a complaint, contact support) and the user's own activity figures (for example orders, response times and spending over time). |
| Why it matters | Customers see what needs their attention at a glance. |
| Who benefits | Shoppers; business buyers |
| Phase | P2 |
| Implementation | Code-level — Custom plugin + Theme/view override |
| Depends on | — |
| Status | Ready |

**Use case US-IAM-025-01**

| Attribute | Description |
|---|---|
| User Story | As a shopper or business buyer, I want a home page after login with my open orders, quotes, items waiting for me and recent messages, so that I see what needs my attention. |
| Use Case ID | US-IAM-025-01 |
| Use Case Name | A home page after login with my open orders, quotes, items waiting for me and recent messages |
| Actor(s) | • Shopper or business buyer<br>• Platform (IAM plugin) |
| Preconditions | • A signed-in customer. |
| Trigger | The customer opens the home dashboard. |
| Basic Flow | 1. Trigger: the customer opens the home dashboard.<br>2. The system responds: it shows open orders, open quotes, items that wait for the customer (for example quotes to answer or deliveries to confirm, from the modules that own them) and the latest messages (AC-IAM-025-01-01). |
| Alternate Flows | Not stated in source |
| Exception Flow | Not stated in source |
| Postconditions | • It shows open orders, open quotes, items that wait for the customer (for example quotes to answer or deliveries to confirm, from the modules that own them) and the latest messages (AC-IAM-025-01-01). |
| Business Rules | Not stated in source |
| Notes | • Story basis: D; FC-M06-001; FC-M06-002 |
| Readiness | Ready |
| Acceptance Criteria | **AC-IAM-025-01-01** — **Given** a signed-in customer, **when** the customer opens the home dashboard, **then** it shows open orders, open quotes, items that wait for the customer (for example quotes to answer or deliveries to confirm, from the modules that own them) and the latest messages. Basis: D; FC-M06-001; FC-M06-002 |

**Use case US-IAM-025-02**

| Attribute | Description |
|---|---|
| User Story | As a shopper or business buyer, I want a quick-action menu on every page (place an order, raise a complaint, contact support), so that common actions are one click away. |
| Use Case ID | US-IAM-025-02 |
| Use Case Name | A quick-action menu on every page (place an order, raise a complaint, contact support) |
| Actor(s) | • Shopper or business buyer<br>• Platform (IAM plugin) |
| Preconditions | • A signed-in customer. |
| Trigger | Any storefront page is shown. |
| Basic Flow | 1. Trigger: any storefront page is shown.<br>2. The system responds: the quick-action menu offers the configured actions and each opens its target page (AC-IAM-025-02-01). |
| Alternate Flows | Not stated in source |
| Exception Flow | Not stated in source |
| Postconditions | • The quick-action menu offers the configured actions and each opens its target page (AC-IAM-025-02-01). |
| Business Rules | Not stated in source |
| Notes | • Story basis: D; FC-M06-004 |
| Readiness | Ready |
| Acceptance Criteria | **AC-IAM-025-02-01** — **Given** a signed-in customer, **when** any storefront page is shown, **then** the quick-action menu offers the configured actions and each opens its target page. Basis: D; FC-M06-004 |

**Use case US-IAM-025-03**

| Attribute | Description |
|---|---|
| User Story | As a business buyer, I want my own figures such as orders and spending over time, so that I can follow my purchasing. |
| Use Case ID | US-IAM-025-03 |
| Use Case Name | My own figures such as orders and spending over time |
| Actor(s) | • Business buyer<br>• Platform (IAM plugin) |
| Preconditions | • A signed-in customer. |
| Trigger | The customer opens the figures panel. |
| Basic Flow | 1. Trigger: the customer opens the figures panel.<br>2. The system responds: orders and spending per month for the chosen period are shown (AC-IAM-025-03-01). |
| Alternate Flows | Not stated in source |
| Exception Flow | Not stated in source |
| Postconditions | • Orders and spending per month for the chosen period are shown (AC-IAM-025-03-01). |
| Business Rules | Not stated in source |
| Notes | • Story basis: D |
| Readiness | Ready |
| Acceptance Criteria | **AC-IAM-025-03-01** — **Given** a signed-in customer, **when** the customer opens the figures panel, **then** orders and spending per month for the chosen period are shown. Basis: D |

**Business rules applied:** none specific to this feature (§8.1 lists the module rules).


### 7.26 PRD-IAM-026 Assisted service by agents

| Item | Value |
|---|---|
| Description (baseline) | Named agents at outlets (such as post offices) register customers and place orders for them, with the agent and outlet recorded. |
| Why it matters | People without internet access or skills can still buy online through a helper. |
| Who benefits | Walk-in customers; outlet agents |
| Phase | P1 |
| Implementation | Code-level — Custom plugin |
| Depends on | — |
| Status | Ready; conditions: AGENT-XOUTLET |

**Use case US-IAM-026-01**

| Attribute | Description |
|---|---|
| User Story | As an outlet agent, I want to log in with my own named account, so that what I do is recorded against me. |
| Use Case ID | US-IAM-026-01 |
| Use Case Name | To log in with my own named account |
| Actor(s) | • Outlet agent<br>• Platform (IAM plugin) |
| Preconditions | • A person is set up as an agent (role Agent, assigned outlet). |
| Trigger | The person logs in. |
| Basic Flow | 1. Trigger: the person logs in.<br>2. The system responds: the login is to a personal account; MFA applies if Agent is an MFA-required role (IAM-004); one account is never shared (BR-IAM-130) (AC-IAM-026-01-01). |
| Alternate Flows | Not stated in source |
| Exception Flow | Not stated in source |
| Postconditions | • The login is to a personal account; MFA applies if Agent is an MFA-required role (IAM-004); one account is never shared (BR-IAM-130) (AC-IAM-026-01-01). |
| Business Rules | • BR-IAM-130 — Assisted service and acting sessions: each agent has a personal account (never shared) and at least one assigned outlet |
| Notes | • Story basis: D; REQ-MPC-FR-025 |
| Readiness | Ready; conditions: AGENT-XOUTLET |
| Acceptance Criteria | **AC-IAM-026-01-01** — **Given** a person is set up as an agent (role Agent, assigned outlet), **when** the person logs in, **then** the login is to a personal account; MFA applies if Agent is an MFA-required role (IAM-004); one account is never shared (BR-IAM-130). Basis: REQ-MPC-FR-025 |

**Use case US-IAM-026-02**

| Attribute | Description |
|---|---|
| User Story | As an outlet agent, I want to register a walk-in customer at the outlet, so that people without internet access or skills get an account. |
| Use Case ID | US-IAM-026-02 |
| Use Case Name | To register a walk-in customer at the outlet |
| Actor(s) | • Outlet agent<br>• Platform (IAM plugin) |
| Preconditions | • An agent holds Identity.Core.AssistedService.Access and has an assigned outlet. |
| Trigger | The agent registers a customer with a mobile number (IAM-002) or email and the customer gives the code received on their phone or email. |
| Basic Flow | 1. Trigger: the agent registers a customer with a mobile number (IAM-002) or email and the customer gives the code received on their phone or email.<br>2. The system responds: the account is created, terms acceptance is recorded with channel Assisted and the agent (IAM-016), the customer record is stamped with agent and outlet, and AUD-IAM-014 is written (AC-IAM-026-02-01). |
| Alternate Flows | Not stated in source |
| Exception Flow | • The mobile number already belongs to an account: when the agent tries to register it, no account is created; message Iam.PhoneInUse is shown; the agent can start an acting session for that customer only if the customer is registered at one of the agent's outlets (BR-IAM-130) (AC-IAM-026-02-02). |
| Postconditions | • The account is created, terms acceptance is recorded with channel Assisted and the agent (IAM-016), the customer record is stamped with agent and outlet, and AUD-IAM-014 is written (AC-IAM-026-02-01). |
| Business Rules | • BR-IAM-130 — Assisted service and acting sessions: each agent has a personal account (never shared) and at least one assigned outlet |
| Notes | • Messages and templates: Iam.PhoneInUse<br>• Permissions: Identity.Core.AssistedService.Access<br>• Audit events: AUD-IAM-014<br>• Story basis: D; REQ-MPC-FR-014 |
| Readiness | Ready; conditions: AGENT-XOUTLET |
| Acceptance Criteria | **AC-IAM-026-02-01** — **Given** an agent holds Identity.Core.AssistedService.Access and has an assigned outlet, **when** the agent registers a customer with a mobile number (IAM-002) or email and the customer gives the code received on their phone or email, **then** the account is created, terms acceptance is recorded with channel Assisted and the agent (IAM-016), the customer record is stamped with agent and outlet, and AUD-IAM-014 is written. Basis: REQ-MPC-FR-014<br>**AC-IAM-026-02-02** — **Given** the mobile number already belongs to an account, **when** the agent tries to register it, **then** no account is created; message Iam.PhoneInUse is shown; the agent can start an acting session for that customer only if the customer is registered at one of the agent's outlets (BR-IAM-130). Basis: Proposed |

**Use case US-IAM-026-03**

| Attribute | Description |
|---|---|
| User Story | As an outlet agent, I want to act for a customer and place orders for them, with me and my outlet recorded, so that assisted purchases are traceable. |
| Use Case ID | US-IAM-026-03 |
| Use Case Name | To act for a customer and place orders for them, with me and my outlet recorded |
| Actor(s) | • Outlet agent<br>• Platform (IAM plugin)<br>• CHK-013 (Assisted checkout) |
| Preconditions | • An agent (role Agent with Customers.CustomersImpersonation and Security.AccessAdminPanel, an assigned outlet) starts an acting session through the native Place order for customer action (Admin CustomerController.Impersonate, as CHK-013) and, where the setting requires it, the customer gives the code sent to them. |
| Trigger | The session starts. |
| Basic Flow | 1. Trigger: the session starts.<br>2. The system responds: the single IAM impersonation filter (BR-IAM-130) has allowed it through the IAM-026 agent rule, native impersonation starts, Impersonation.Started is written, an AssistedServiceRecord (act) with agent and outlet is written (AUD-IAM-014), and orders placed in the session get the native order note naming the agent; the order-to-agent and outlet link is the CHK-013 AssistedOrder record (AC-IAM-026-03-01).<br>3. The agent ends it or logs out: impersonation ends and Impersonation.Finished is written (AC-IAM-026-03-04). |
| Alternate Flows | Not stated in source |
| Exception Flow | • An agent tries to act for an administrator or another staff account: when the request is made, the IAM-026 agent rule denies it and the IAM impersonation filter refuses it with message Iam.ScopeDenied (native code refuses only administrators); AUD-IAM-019 is written (AC-IAM-026-03-02).<br>• A customer is registered at another outlet or has no outlet stamp, and no other rule provider allows the agent: when an agent tries to act for that customer, the IAM-026 agent rule denies it (agents act only for their own outlet's customers), the filter refuses it with message Iam.ScopeDenied and AUD-IAM-019 is written (AC-IAM-026-03-03). |
| Postconditions | • Impersonation ends and Impersonation.Finished is written (AC-IAM-026-03-04). |
| Business Rules | • BR-IAM-130 — Assisted service and acting sessions: each agent has a personal account (never shared) and at least one assigned outlet |
| Notes | • Messages and templates: Iam.ScopeDenied<br>• Permissions: Customers.CustomersImpersonation<br>• Audit events: AUD-IAM-014, AUD-IAM-019<br>• Story basis: D; REQ-MPC-FR-025 |
| Readiness | Ready; conditions: AGENT-XOUTLET |
| Acceptance Criteria | **AC-IAM-026-03-01** — **Given** an agent (role Agent with Customers.CustomersImpersonation and Security.AccessAdminPanel, an assigned outlet) starts an acting session through the native Place order for customer action (Admin CustomerController.Impersonate, as CHK-013) and, where the setting requires it, the customer gives the code sent to them, **when** the session starts, **then** the single IAM impersonation filter (BR-IAM-130) has allowed it through the IAM-026 agent rule, native impersonation starts, Impersonation.Started is written, an AssistedServiceRecord (act) with agent and outlet is written (AUD-IAM-014), and orders placed in the session get the native order note naming the agent; the order-to-agent and outlet link is the CHK-013 AssistedOrder record. Basis: REQ-MPC-FR-025; FIT (CustomerController.Impersonate; WebWorkContext; OrderProcessingService order note)<br>**AC-IAM-026-03-02** — **Given** an agent tries to act for an administrator or another staff account, **when** the request is made, **then** the IAM-026 agent rule denies it and the IAM impersonation filter refuses it with message Iam.ScopeDenied (native code refuses only administrators); AUD-IAM-019 is written. Basis: Proposed; FIT (Impersonate checks IsAdminAsync only)<br>**AC-IAM-026-03-03** — **Given** a customer is registered at another outlet or has no outlet stamp, and no other rule provider allows the agent, **when** an agent tries to act for that customer, **then** the IAM-026 agent rule denies it (agents act only for their own outlet's customers), the filter refuses it with message Iam.ScopeDenied and AUD-IAM-019 is written. Basis: Proposed (owner decision: one impersonation filter, IAM-026)<br>**AC-IAM-026-03-04** — **Given** an acting session is open, **when** the agent ends it or logs out, **then** impersonation ends and Impersonation.Finished is written. Basis: FIT (CustomerController.Logout) |

**Use case US-IAM-026-04**

| Attribute | Description |
|---|---|
| User Story | As a client administrator, I want to assign agents to outlets, so that each agent works only at their outlets. |
| Use Case ID | US-IAM-026-04 |
| Use Case Name | To assign agents to outlets |
| Actor(s) | • Client administrator<br>• Platform (IAM plugin) |
| Preconditions | • A user holds Identity.Core.Agents.CreateEditDelete. |
| Trigger | The user assigns an agent to an outlet (PRD-LOG-003). |
| Basic Flow | 1. Trigger: the user assigns an agent to an outlet (PRD-LOG-003).<br>2. The system responds: the assignment is saved, used for every later stamp and turned into the IAM-008 scope "outlet" of that agent (AC-IAM-026-04-02). |
| Alternate Flows | Not stated in source |
| Exception Flow | • An agent has no assigned outlet: when the agent tries to register a customer or start an acting session, it is refused with message Iam.AgentNotAssigned (AC-IAM-026-04-01).<br>• The assisted service feature is off for the store (IC-PLT-02 IsEnabled false for PRD-IAM-026): when an agent opens the agent pages or posts Place order for customer, the agent pages are not shown and the IAM-026 agent rule returns not applicable, so the IAM impersonation filter refuses the acting session of an agent (BR-IAM-141) (AC-IAM-026-04-03). |
| Postconditions | • The assignment is saved, used for every later stamp and turned into the IAM-008 scope "outlet" of that agent (AC-IAM-026-04-02). |
| Business Rules | • BR-IAM-141 — Feature state: IAM features that are not always on (IAM-005, IAM-009, IAM-013, IAM-022, IAM-023, IAM-025, IAM-026, IAM-027) check IC-PLT-02 IsEnabled for the store before showing pages or widgets, running filters or scheduled work |
| Notes | • Messages and templates: Iam.AgentNotAssigned<br>• Permissions: Identity.Core.Agents.CreateEditDelete<br>• Contracts: IC-PLT-02<br>• Story basis: D |
| Readiness | Ready; conditions: AGENT-XOUTLET |
| Acceptance Criteria | **AC-IAM-026-04-01** — **Given** an agent has no assigned outlet, **when** the agent tries to register a customer or start an acting session, **then** it is refused with message Iam.AgentNotAssigned. Basis: Proposed<br>**AC-IAM-026-04-02** — **Given** a user holds Identity.Core.Agents.CreateEditDelete, **when** the user assigns an agent to an outlet (PRD-LOG-003), **then** the assignment is saved, used for every later stamp and turned into the IAM-008 scope "outlet" of that agent. Basis: D<br>**AC-IAM-026-04-03** — **Given** the assisted service feature is off for the store (IC-PLT-02 IsEnabled false for PRD-IAM-026), **when** an agent opens the agent pages or posts Place order for customer, **then** the agent pages are not shown and the IAM-026 agent rule returns not applicable, so the IAM impersonation filter refuses the acting session of an agent (BR-IAM-141). Basis: Proposed |

**Business rules applied:** BR-IAM-130; BR-IAM-141 (§8.1).


### 7.27 PRD-IAM-027 Company cost centres and budgets

| Item | Value |
|---|---|
| Description (baseline) | Business customers set up cost centres and spending budgets for their staff users. |
| Why it matters | Companies control spending by department. |
| Who benefits | Business buyers |
| Phase | P2 |
| Implementation | Code-level — Custom plugin |
| Depends on | PRD-IAM-022 |
| Status | On hold: PH-INF |

**Use case US-IAM-027-01**

| Attribute | Description |
|---|---|
| User Story | As a company administrator, I want to set up cost centres and spending budgets for our staff users, so that we control spending by department. |
| Use Case ID | US-IAM-027-01 |
| Use Case Name | To set up cost centres and spending budgets for our staff users |
| Actor(s) | • Company administrator<br>• Platform (IAM plugin)<br>• CHK-018 (B2B purchase approval) |
| Preconditions | • Company C has cost centres with budgets for a period. |
| Trigger | A member places an order charged to a cost centre. |
| Basic Flow | 1. Trigger: a member places an order charged to a cost centre.<br>2. The system responds: the order is linked to the cost centre and its spent amount increases by the order total (AC-IAM-027-01-01).<br>3. The member tries to place it: the configured action applies: refuse with message Iam.BudgetExceeded, or send the order for approval (CHK-018) (AC-IAM-027-01-02). |
| Alternate Flows | • An order linked to a cost centre is cancelled or refunded: when the change completes, the spent amount is reduced by the cancelled or refunded amount (AC-IAM-027-01-03). |
| Exception Flow | Not stated in source |
| Postconditions | • The order is linked to the cost centre and its spent amount increases by the order total (AC-IAM-027-01-01). |
| Business Rules | • BR-IAM-120 — Company membership and company roles (buyer, approver, company administrator) are kept in IAM plugin tables per company, not as nopCommerce customer roles<br>• BR-IAM-141 — Feature state: IAM features that are not always on (IAM-005, IAM-009, IAM-013, IAM-022, IAM-023, IAM-025, IAM-026, IAM-027) check IC-PLT-02 IsEnabled for the store before showing pages or widgets, running filters or scheduled work |
| Notes | • Messages and templates: Iam.BudgetExceeded<br>• Story basis: D |
| Readiness | On hold: PH-INF |
| Acceptance Criteria | **AC-IAM-027-01-01** — **Given** company C has cost centres with budgets for a period, **when** a member places an order charged to a cost centre, **then** the order is linked to the cost centre and its spent amount increases by the order total. Basis: D<br>**AC-IAM-027-01-02** — **Given** an order would exceed the remaining budget, **when** the member tries to place it, **then** the configured action applies: refuse with message Iam.BudgetExceeded, or send the order for approval (CHK-018). Basis: Proposed<br>**AC-IAM-027-01-03** — **Given** an order linked to a cost centre is cancelled or refunded, **when** the change completes, **then** the spent amount is reduced by the cancelled or refunded amount. Basis: Proposed |

**Business rules applied:** BR-IAM-120; BR-IAM-141 (§8.1).


## 8. Business rules and state models

### 8.1 Business rules

| ID | Rule | Features | Basis |
|---|---|---|---|
| BR-IAM-001 | The registration type (CustomerSettings.UserRegistrationType: Standard, EmailValidation, AdminApproval, Disabled) is one value for the installation. Trade-account approval does not use AdminApproval; it uses the IAM-023 queue so that retail registration stays open. | IAM-001, IAM-023 | FIT (UserRegistrationType; setting saved without store scope) |
| BR-IAM-002 | Identifiers: an email address belongs to at most one customer (native check). A normalised mobile number belongs to at most one customer (unique index on the IAM PhoneIdentity table; the native 5.00 check refuses only a number already verified on another account). One customer may hold both. | IAM-001, IAM-002 | REQ-MPC-FR-001; FIT (ICustomerService.IsAlreadyExistsVerifiedPhoneNumberAsync, CustomerService.cs:605-615) |
| BR-IAM-003 | Block lists: registration and login POSTs (native CustomerController.Register and Login, and the IAM plugin mobile registration and mobile login POST actions) are checked against SEL-013 Block entries with scope registration, login or all by the Platform core action filter owned by SEL-013. IAM keeps no block list of its own and adds no second filter. | IAM-001, IAM-002 | see SEL-013 (REQ-MPC-FR-118) |
| BR-IAM-010 | Mobile numbers are stored in international format; a number entered without the international prefix gets the calling code of the store default country. | IAM-002 | Proposed |
| BR-IAM-011 | Mobile identity: login by mobile number and code is native in nopCommerce 5.00 (OtpSettings.LoginByPhoneEnabled, ValidateCustomerByPhoneAsync) and is not rebuilt. DI overrides registered in the IAM plugin INopStartup with Order >= 3000 remain for what 5.00 does not do: ICustomerRegistrationService (RegisterCustomerAsync accepts a verified mobile number without email; the subclass inherits the new ValidateCustomerByPhoneAsync unchanged) and IAuthenticationService (adds a customer GUID claim at sign-in and resolves it, so customers without email are found, and applies the session checks of BR-IAM-040). Reason: native RegisterCustomerAsync rejects an empty email and password, and CookieAuthenticationService resolves customers only by the email or username claim. Only the IAM plugin overrides these two interfaces (DI-override register). | IAM-002, IAM-006 | FIT (CustomerRegistrationService.cs:203-226, 264-281; CookieAuthenticationService.cs:58-59, 110-133; L1 §6.2 principle 7); VER-500 |
| BR-IAM-012 | One-time codes are random, single-use, bound to one purpose (register, login, recover, confirm change, assisted consent, MFA), stored only as a hash, and never logged in clear. Validity, length, maximum attempts, resend interval and send limits per number are the native OtpSettings values (OtpTimeLife, OtpLength, OtpFailedAllowedAttempts, OtpCountAttemptsToSendCode, OtpTimeToRepeat; defaults not stated); the limit per IP address is an IAM setting (default not stated). Failed attempts on IAM codes count towards the native lockout (FailedLoginAttempts); native login codes are locked by the native OTP counter instead. | IAM-002, IAM-004, IAM-026 | Proposed; NFR-X-001; FIT (Libraries/Nop.Core/Domain/Customers/OtpSettings.cs:13-39); VER-500 |
| BR-IAM-013 | Native code login (5.00) does not check the password lockout or MFA: an IAM global action filter on the native code-verification action refuses sign-in for a customer whose CannotLoginUntilDateUtc is in the future, and for members of MFA-required or sensitive roles requires the password step and the second factor (BR-IAM-030, BR-IAM-020). | IAM-002, IAM-004 | Proposed; FIT (CustomerRegistrationService.ValidateCustomerByPhoneAsync, CustomerRegistrationService.cs:203-226); VER-500 |
| BR-IAM-020 | For accounts holding a role listed as sensitive, password recovery by email link or SMS code alone is not allowed: an IAM global action filter on CustomerController.PasswordRecoverySend [POST] stops the native token, opens a recovery request and shows the same neutral message as for other accounts; the request needs the configured extra check (security questions with hashed answers, or confirmation by a second user holding Customers.CustomersCreateEditDelete who is not the requester). | IAM-003, IAM-002 | D; FC-M10-016; FIT |
| BR-IAM-021 | Password rules use only the native CustomerSettings values (length, complexity, reuse, lifetime, lockout, recovery link validity); no second password policy is built. | IAM-003 | FIT |
| BR-IAM-030 | MFA by role: the setting "MFA-required roles" lists role system names. An IAM global action filter redirects a signed-in member of such a role without a selected provider to the native MFA settings page (exempt: that page, logout, policy pages, static files). MultiFactorAuthenticationSettings.ForceMultifactorAuthentication stays off, because it would force every holder of Security.EnableMultiFactorAuthentication, including Registered. Members of MFA-required roles cannot remove their own provider. For single sign-on, the identity provider must assert a multi-factor method, else the IAM second factor is requested (Proposed). | IAM-004, IAM-005 | REQ-MPC-FR-012; FIT (ForceMultiFactorAuthenticationAttribute) |
| BR-IAM-031 | Second factors are IMultiFactorAuthenticationMethod plugins following the bundled GoogleAuthenticator pattern: the verification component posts to the plugin controller, which reads CustomerMultiFactorAuthenticationInfo from the session and calls SignInCustomerAsync only after a successful check. Email-code, SMS-code and hardware-key providers are built; GoogleAuthenticator is reused (still the only bundled provider in 5.00.1). The SMS-code provider sends through IC-IAM-01, which delivers through the native 5.00 ISmsService and the active ISmsProvider. | IAM-004 | FIT (Plugins/Nop.Plugin.MultiFactorAuth.GoogleAuthenticator/Controllers/AuthenticationController.cs) |
| BR-IAM-040 | Sessions: every sign-in creates a UserSession record (session id claim, customer, created, last activity, IP address, user agent). The IAuthenticationService override (BR-IAM-011) rejects a request whose session is revoked, expired by the idle timeout of the user class, or over the concurrent-session limit. Forced logout revokes all sessions and sets Customer.RequireReLogin; the native next successful login clears RequireReLogin. Session changes for one customer run under ILocker key 'iam-session-{CustomerId}'. | IAM-006 | REQ-MPC-FR-013; FIT (Customer.RequireReLogin; ValidateCustomerAsync resets it); Proposed |
| BR-IAM-050 | Product role catalogue (role system names, Proposed; the modules that use each name as a default role or actor role are in brackets, checked over all 24 content files). Staff roles: Finance (CHK, CHN, EGV, FIN, INT, INV, LOG, MKT, PAY, RET, RPT, SEL, SVC), Risk (AI, CRM, ORD, PAY, SEL), Agent (IAM-026; CHK, CHN, CRM, EGV, LOG, PAY, RET, RPT, SVC, TRK), Auditor (IAM, SEC; ADM, CAT, DOC, INV, PLT, RPT), SecurityOfficer (IAM, SEC), PrivacyOfficer (IAM, SEC), Operations (ADM, SVC), OperationsManager (RPT), Compliance (ADM, DOC, SEL), PlatformOperator (ADM, PLT), Support and SupportManager (IAM, CRM, RET, RPT; Support also INV, TRK), AccountManager (CRM), AgencyOfficer and AgencyAdmin (EGV), Programme (FIN), Stock and Quality (INV), Warehouse (INV, LOG, RET, RPT), LogisticsOps and Courier (LOG, TRK), Marketing (MKT, RPT, SRC), Content and ContentApprover (MKT), Catalogue (SRC), Analyst (RPT), Procurement (SEL). Customer roles: TradeBuyer (IAM-023; LOG, PAY); one system customer role per company, generated by CAT-040 for company assortments, with system name CompanyAssortment-{CompanyId} (Proposed by CAT-040). Native roles are unchanged and keep their native system names: Administrators, Registered, Guests, Vendors; ForumModerators exists only when the bundled Misc.Forums plugin is installed (5.00 moved it out of core: ForumDefaults.ForumModeratorsRoleName); seller staff are Vendors members, never a separate admin role (BR-SEL-010). Company roles buyer, approver and company administrator are not nopCommerce roles (BR-IAM-120). Every module uses exactly these names as default roles. The IAM plugin creates every missing catalogue role at install and at every application start (AC-IAM-007-04-01); no module relies on native start-up to create a role, because PermissionService creates a missing role only when it installs a new permission. A name used by a module and missing here is a defect (T-IAM-12). Client-specific roles (for example the ORD order-intervention approver, KTDA sales, export and legal roles) are configuration only. | IAM-007, IAM-011 | Proposed; owner decisions Role system names and Roles; FIT (PermissionService.InsertPermissionsAsync) |
| BR-IAM-051 | Effective permissions are the union of the permissions of all roles of the user, plus active delegations (IAM-009), limited by the user scopes (IAM-008). There are no deny rules. | IAM-007, IAM-008, IAM-009 | FIT (PermissionService.AuthorizeAsync); Proposed (delegation, scope) |
| BR-IAM-052 | Role and permission packs use 5.00 permission system names (news, polls and forums permissions are the plugin names News.*, Polls.*, Forums.*); an unknown name is an error in pack validation (IC-PLT-01 Validate) and grants nothing, because native InsertPermissionMappingAsync would skip it without error. | IAM-007 | FIT (L1 §6.1, §6.5) |
| BR-IAM-053 | Role packs: native permissions that a module gives to a product role are declared in that module chapter and mapped by the role pack (PLT-003, IC-PLT-01 Apply through IPermissionService.InsertPermissionMappingAsync); native default mappings are not removed by a pack unless the pack names the removal. Examples: Customers.CustomersImpersonation and Security.AccessAdminPanel to Agent (CHK-013) and to AccountManager (CRM-015); Security.AccessAdminPanel, Catalog.ProductsView and Orders.OrdersView to AgencyOfficer and AgencyAdmin, and shipment permissions to AgencyOfficer only (EGV-006); native Promotions, ContentManagement and Orders.GiftCards permissions to Marketing and Content (MKT). | IAM-007 | Proposed; FIT (PermissionService.InsertPermissionMappingAsync skips unknown names) |
| BR-IAM-054 | Permission exclusions declared by modules are checked when a pack is validated (IC-PLT-01) and when a mapping is saved in SecurityController.PermissionEditPopup [POST] (IAM action filter): Vendors never hold Orders.ReturnRequestsView or Orders.ReturnRequestsCreateEditDelete (RET); Support and SupportManager never hold Customers.CustomersView (BR-CRM-030). Customer-to-role assignments that break BR-SEL-010 (a seller staff user in a non-Vendors admin role) are SEL checks, not IAM checks. | IAM-007, IAM-010 | Proposed;, |
| BR-IAM-060 | Scopes (dimension store, region, outlet, category, value band or time window; values) are assigned per user or role and per permission. List queries in the admin area filter by scope (registered core modification, L1 §6.3); single-record actions are checked by an IAM action filter; permission checks with scopes and delegations go through the single IAM override of IPermissionService (also used by SEC-010 time-bound grants). The outlet scope of an agent comes from the IAM-026 outlet assignment. A value-band scope on an approval permission is the authority limit read by ADM-006 through IC-IAM-06. | IAM-008, IAM-009 | D; FC-M10-009; FIT (L1 §6.3 PRD-IAM-008) |
| BR-IAM-070 | Delegation: a user can delegate only a permission they hold and that is marked delegable; it has a start and an end; it cannot be delegated again; segregation-of-duties rules (for example BR-PAY-080) still apply to the delegate. | IAM-009 | D; FC-M10-010; Proposed |
| BR-IAM-080 | Read-access logging: an IAM global action filter on admin actions that display one customer personal data (Customer Edit, Order Edit, customer address edit; the full list is fixed at build start) writes AUD-IAM-010 with staff user, customer and page. | IAM-010, IAM-018 | REQ-MPC-FR-024; Proposed |
| BR-IAM-081 | Deactivation (by the customer or by staff) keeps all data and stops sign-in and marketing; deletion with anonymisation is only through IAM-017. Self-reactivation is allowed only after self-deactivation. | IAM-010 | REQ-MPC-FR-016; Proposed |
| BR-IAM-090 | Authentication events are append-only: the IAM plugin offers no edit or delete, and every event is copied to the SEC-004 audit trail. | IAM-012 | REQ-MPC-FR-015; FC-M10-014 |
| BR-IAM-091 | Policy acceptance is recorded only by IAM (IC-IAM-05), per policy system name and version, for a customer and, for seller terms, the vendor (SEL-006 records through IC-IAM-05). The version and the "re-acceptance required" flag are those of the MKT-008 Effective version returned by IC-MKT-03; IAM stores no policy text, no version and no flag of its own. When the Effective version has the flag set, an IAM global action filter redirects signed-in users (and seller owners in the seller portal) who have not accepted it to the acceptance page (exempt: logout, policy pages, the acceptance page, static files). | IAM-016 | REQ-MPC-FR-006; owner decision Terms and consent records; Proposed |
| BR-IAM-092 | Erasure completeness: the IAM override of IGdprService.PermanentDeleteCustomerAsync calls the native method and also clears Customer.FirstName, LastName, Gender, DateOfBirth, Company, StreetAddress, StreetAddress2, ZipPostalCode, City, County, Phone (and PhoneSmsVerified), Fax, VatNumber, CustomCustomerAttributesXML, LastIpAddress and AdminComment, and the personal data in IAM plugin tables (phone identity, sessions, verification results, preferences), and calls every erasure provider registered through IC-IAM-08; the request completes only when all providers report Erased. Orders, invoices and their addresses are kept or anonymised under the retention rules (PLT-020, SEC-012). In 5.00 the native method also deletes the cart and all custom wishlists, and private messages sent and received; news comments and forum data are deleted by the Misc.News and Misc.Forums plugins on CustomerPermanentlyDeleted, so IAM does not handle them. | IAM-017 | FIT (GdprService.PermanentDeleteCustomerAsync clears only Email, EmailToRevalidate, Username; ignores orders and ActivityLog — Libraries/Nop.Services/Gdpr/GdprService.cs:258-351; Plugins/Nop.Plugin.Misc.News/Services/Events/EventConsumer.cs:69); VER-500 |
| BR-IAM-093 | Every privacy request (staff export, correction, deletion) gets a due date from the country profile (SEC-012); an open request past its due date is Overdue. | IAM-017 | Inference from REQ-KTDA-LEG-001 (law names inference, DP-01) |
| BR-IAM-100 | Account synchronisation uses the single INT-004 outbox (IntegrationMessage, SM-INT-01): IAM event consumers only write outbox messages with channel "account sync" through IC-INT-09 Enqueue; the INT delivery task sends them through the IC-IAM-03 adapter with the INT-004 retry and dead-letter policy; IAM keeps no outbox, retry state or queue view of its own. Inbound changes update only configured fields; the system of record per field is configuration. | IAM-019 | REQ-MPC-FR-020; FIT (L1 §6.2 principle 8); BR-INT-010; BR-INT-015 |
| BR-IAM-110 | Identity verification stores the result, adapter, reference, time and the fields matched, not identity document images; results are kept under the retention rules (PLT-020). | IAM-020 | Proposed |
| BR-IAM-120 | Company membership and company roles (buyer, approver, company administrator) are kept in IAM plugin tables per company, not as nopCommerce customer roles; the nopCommerce role TradeBuyer marks an approved trade buyer and drives trade prices and ACL. Other modules read the company of a customer through IC-IAM-07; CAT-040 per-company system roles are allowed and are kept in step through the IC-IAM-07 membership provider; approval thresholds per company role are stored by CHK-018. | IAM-022, IAM-023, IAM-027 | D; Proposed |
| BR-IAM-121 | Where TaxSettings.EuVatEnabled is switched on to record VAT numbers, EuVatUseWebService and EuVatAllowVatExemption stay off and Country.SubjectToVat is set deliberately for every country, because native IsVatExemptAsync exempts addresses in countries not subject to VAT. | IAM-024 | FIT (TaxService.IsVatExemptAsync) |
| BR-IAM-130 | Assisted service and acting sessions: each agent has a personal account (never shared) and at least one assigned outlet. The acting session is the native impersonation (Admin CustomerController.Impersonate, used by CHK-013 and CRM-015), so native order notes record the actor. The action carries ONE product filter, owned by IAM-026 (owner decision): a global action filter matched on the method name Impersonate (the route action name is Edit), running after the native CheckPermission authorization filter (Customers.CustomersImpersonation). It allows members of Administrators; for every other user it calls every registered rule provider (IC-IAM-09) and allows the request when at least one provider returns Allow; otherwise it refuses with the message key of the first Deny, else Iam.ImpersonationNotAllowed, and writes AUD-IAM-019. Providers: the IAM-026 agent rule (holders of Identity.Core.AssistedService.Access: the agent has an assigned outlet, the customer is not staff, the customer is registered at one of the agent outlets, and the customer code is given where the setting requires it) and the CRM-015 account-manager rule (the user is the assigned account manager of the customer). A provider whose feature is off for the store (IC-PLT-02) returns NotApplicable. The native checks of the action (inactive customer, non-administrator acting for an administrator) still apply. No other module adds a filter to this action. Registrations by an agent are stamped with agent and outlet (AssistedServiceRecord); the order link with agent and outlet is the CHK-013 AssistedOrder record. | IAM-010, IAM-026 | REQ-MPC-FR-014; REQ-MPC-FR-025; owner decision Impersonation filters; FIT (CustomerController.Impersonate; CheckPermissionAttribute is an authorization filter; WebWorkContext; OrderProcessingService) |
| BR-IAM-140 | Key catalogue: every new IAM setting key is listed in the IAM plugin key catalogue with key, type, layer, secret flag and default (NFR-X-008); keys that hold a credential, key or token (identity-provider client secrets, verification adapter credentials, synchronisation endpoint credentials, SMS gateway credentials if held by IAM) are flagged secret, so packs refuse them and exports omit them (BR-PLT-013). | IAM-005, IAM-019, IAM-020 | Proposed |
| BR-IAM-141 | Feature state: IAM features that are not always on (IAM-005, IAM-009, IAM-013, IAM-022, IAM-023, IAM-025, IAM-026, IAM-027) check IC-PLT-02 IsEnabled for the store before showing pages or widgets, running filters or scheduled work; the core identity features are always on. | IAM-005, IAM-022, IAM-023, IAM-026, IAM-027 | Proposed |
| BR-IAM-150 | Messages: IAM notifications (welcome and validation emails, invitation, new-country login, trade decision, privacy-request updates, deactivation and reactivation) are sent by TRK-005: native templates through IWorkflowMessageService (TRK-005 override) and IAM templates through the TRK-005 engine (IAM registers them through IC-TRK-04 RegisterEventCode at installation; names Proposed, listed in BR-TRK-023: Iam.NewCountryLogin.CustomerNotification, Iam.Invitation.Email, Iam.TradeApplicationApproved.CustomerNotification, Iam.Core.TradeApplicationRejected, Iam.Core.MobileRegistrationCompleted, Iam.Core.SuspiciousLogin, Iam.Core.AccessReviewOpened, Iam.Core.AccessReviewOverdue, Iam.Core.PolicyAcceptanceRequired, Iam.Core.PrivacyRequestUpdated, Iam.Core.AccountDeactivated, Iam.Core.AccountReactivated). One-time codes are the only IAM messages sent outside TRK-005: IAM calls CHN-005 directly (IC-IAM-01, owner decision). Before sending a code IAM calls IC-TRK-06 CheckAllowed (category Security codes) and sends nothing when TRK answers Blocked; an opted-out number (also one without an account) gets a code only if the client marks Security codes mandatory (BR-TRK-031, BR-TRK-026). Quiet hours and message limits do not apply to codes. Delivery results of codes stay in the IAM OtpChallenge and the CHN-005 log. | IAM-002, IAM-004, IAM-026 | Proposed; owner decision Messages outside TRK (MSG-ROUTE); BR-TRK-026 |


### 8.2 State models (Proposed)

Only the transitions listed are allowed; any other transition is rejected and logged.

| Model | Entity | From | Event | Guard | To | Side effect |
|---|---|---|---|---|---|---|
| SM-IAM-01 | OtpChallenge | (none) | code requested | send limits not exceeded | Issued | code sent through IC-IAM-01; hash stored |
| SM-IAM-01 | OtpChallenge | Issued | correct code entered within validity | same purpose and number | Verified | purpose action runs; code cannot be reused |
| SM-IAM-01 | OtpChallenge | Issued | wrong code entered | attempts left | Issued | attempt counter increases |
| SM-IAM-01 | OtpChallenge | Issued | wrong code entered | no attempts left | Locked | Iam.Otp.TooManyAttempts |
| SM-IAM-01 | OtpChallenge | Issued | validity ends | — | Expired | — |
| SM-IAM-01 | OtpChallenge | Issued | new code requested for the same purpose | resend interval passed | Superseded | new challenge Issued |
| SM-IAM-02 | Customer account | (none) | registration completes | registration type Standard, or mobile code verified | Active | native Active = true |
| SM-IAM-02 | Customer account | (none) | registration completes | registration type EmailValidation or AdminApproval | Inactive (pending) | native Active = false |
| SM-IAM-02 | Customer account | Inactive (pending) | email link opened or staff activate | — | Active | — |
| SM-IAM-02 | Customer account | Active | owner deactivates | owner confirmed with password or code | DeactivatedByUser | Active = false; sessions revoked; AUD-IAM-008 |
| SM-IAM-02 | Customer account | Active | staff deactivate | Customers.CustomersCreateEditDelete | DeactivatedByStaff | Active = false; sessions revoked; AUD-IAM-008 |
| SM-IAM-02 | Customer account | DeactivatedByUser | owner requests reactivation | code confirmed | Active | Active = true; AUD-IAM-008 |
| SM-IAM-02 | Customer account | DeactivatedByStaff | staff reactivate | Customers.CustomersCreateEditDelete | Active | AUD-IAM-008 |
| SM-IAM-02 | Customer account | Active | failed attempts reach FailedPasswordAllowedAttempts | — | LockedOut (temporary) | native CannotLoginUntilDateUtc set |
| SM-IAM-02 | Customer account | LockedOut (temporary) | lockout time passes | — | Active | — |
| SM-IAM-02 | Customer account | Active / Inactive / Deactivated | deletion executed (IAM-017) | deletion request approved | Deleted (anonymised, final) | native Deleted = true; BR-IAM-092 |
| SM-IAM-03 | UserSession | (none) | sign-in | concurrent limit allows, or oldest revoked | Active | session id claim issued |
| SM-IAM-03 | UserSession | Active | request after idle timeout | — | Expired | Iam.SessionExpired |
| SM-IAM-03 | UserSession | Active | forced logout, single-session end, limit reached, password / MFA / role change | — | Revoked | AUD-IAM-005 |
| SM-IAM-03 | UserSession | Active | user logs out | — | LoggedOut | native Logout |
| SM-IAM-04 | Invitation | (none) | administrator invites | — | Sent | invitation email |
| SM-IAM-04 | Invitation | Sent | invitee completes set-up | link valid | Accepted | account created; roles assigned; AUD-IAM-017 |
| SM-IAM-04 | Invitation | Sent | validity ends / administrator revokes | — | Expired / Revoked | — |
| SM-IAM-05 | AccessReviewItem | (none) | campaign opens | — | Pending | reviewer notified |
| SM-IAM-05 | AccessReviewItem | Pending | reviewer decides | — | Kept / Revoked | Revoked removes role mapping; AUD-IAM-009 |
| SM-IAM-05 | AccessReviewItem | Pending | campaign deadline passes | — | Overdue | listed to administrators |
| SM-IAM-05 | AccessReviewItem | Overdue | reviewer decides | — | Kept / Revoked | as above |
| SM-IAM-06 | PrivacyRequest | (none) | customer submits correction or deletion, or staff start an export | — | Received | due date from SEC-012 profile |
| SM-IAM-06 | PrivacyRequest | Received | reviewer starts work | Customers.GDPRManage | InProgress | — |
| SM-IAM-06 | PrivacyRequest | Received / InProgress | reviewer completes / rejects | — | Completed / Rejected | customer notified; AUD-IAM-011 |
| SM-IAM-06 | PrivacyRequest | Received / InProgress | due date passes | not completed | Overdue | privacy officer notified |
| SM-IAM-06 | PrivacyRequest | Overdue | reviewer completes / rejects | — | Completed / Rejected | AUD-IAM-011 |
| SM-IAM-07 | TradeApplication | (none) | business submits | — | Received | Iam.TradeApplicationReceived |
| SM-IAM-07 | TradeApplication | Received | reviewer approves | Identity.Core.TradeAccounts.CreateEditDelete | Approved | TradeBuyer role; company created; AUD-IAM-013 |
| SM-IAM-07 | TradeApplication | Received | reviewer rejects | reason given | Rejected | applicant told the reason; AUD-IAM-013 |
| SM-IAM-07 | TradeApplication | Received | reviewer asks for more information | — | MoreInfoRequested | applicant told what is missing |
| SM-IAM-07 | TradeApplication | MoreInfoRequested | applicant resubmits | — | Received | — |
| SM-IAM-08 | Delegation | (none) | delegation saved | BR-IAM-070 | Scheduled | AUD-IAM-007 |
| SM-IAM-08 | Delegation | Scheduled | start date reached | — | Active | — |
| SM-IAM-08 | Delegation | Active | end date reached | — | Ended | AUD-IAM-007 |
| SM-IAM-08 | Delegation | Scheduled / Active | delegator or administrator revokes | — | Revoked | AUD-IAM-007 |
| SM-IAM-09 | RecoveryRequest | (none) | recovery requested for a sensitive account | — | Opened | neutral message shown |
| SM-IAM-09 | RecoveryRequest | Opened | extra check passed | answers match, or second user confirms | Verified | one-time reset link issued; AUD-IAM-003 |
| SM-IAM-09 | RecoveryRequest | Opened | check failed / confirmer rejects / validity ends | — | Rejected / Expired | AUD-IAM-003 |
| SM-IAM-10 | VerificationCase | (none) | verification requested | KYC required for the process | Requested | adapter called |
| SM-IAM-10 | VerificationCase | Requested | adapter result | — | Verified / NotVerified | AUD-IAM-015 |
| SM-IAM-10 | VerificationCase | Requested | adapter result Inconclusive or Unavailable | — | ManualReview | review queue |
| SM-IAM-10 | VerificationCase | ManualReview | reviewer decides | Identity.Core.Verification.CreateEditDelete; reason | Verified / NotVerified | AUD-IAM-015 |
| SM-IAM-12 | SuspiciousLoginFlag | (none) | detection rule fires | rule active | Open | security officer notified; AUD-IAM-016 |
| SM-IAM-12 | SuspiciousLoginFlag | Open | officer confirms | — | Confirmed | optional forced logout (IAM-006); AUD-IAM-016 |
| SM-IAM-12 | SuspiciousLoginFlag | Open | officer dismisses | reason given | Dismissed | AUD-IAM-016 |


## 9. Data model (Proposed design — to be approved)

New entities are plugin tables (FluentMigrator migrations in the product assembly); native entities are not altered unless the L1 §6.3 register says so.

| Entity | Fields | Features | Relation to native nopCommerce |
|---|---|---|---|
| PhoneIdentity (new) | CustomerId, NormalisedPhone (unique index), VerifiedOnUtc, IsLoginIdentifier | IAM-002, IAM-014 | Customer.Phone (native) is kept equal for display and native features |
| OtpChallenge (new) | Id, PhoneOrEmail, Purpose, CodeHash, Attempts, Status (SM-IAM-01), CreatedOnUtc, ExpiresOnUtc, CustomerId (if known) | IAM-002, IAM-004, IAM-026 | |
| UserSession (new) | SessionId, CustomerId, CreatedOnUtc, LastActivityUtc, IpAddress, UserAgent, Status (SM-IAM-03), RevokedBy, RevokedReason | IAM-006 | Native Customer.RequireReLogin used for forced logout; native auth cookie carries the session id claim |
| RecoveryRequest / SecurityAnswer (new) | Request: CustomerId, Method, Status (SM-IAM-09), ConfirmedBy; Answer: CustomerId, QuestionKey, AnswerHash | IAM-003 | Native recovery token generic attributes are not issued for sensitive accounts |
| ScopeAssignment (new) | Id, CustomerId or CustomerRoleId, PermissionSystemName, Dimension (store, region, outlet, category, value band, time window), Values, ValidFrom, ValidTo | IAM-008 | Native PermissionRecord and mappings unchanged; admin query filtering is the registered core modification |
| Delegation (new) | Id, DelegatorId, DelegateId, PermissionSystemName, StartUtc, EndUtc, Status (SM-IAM-08), Reason | IAM-009 | |
| Invitation (new) | Id, Email, RoleSystemNames, TokenHash, Status (SM-IAM-04), InvitedBy, ExpiresOnUtc, CustomerId (after acceptance) | IAM-011 | |
| AccessReviewCampaign / AccessReviewItem (new) | Campaign: Roles, Reviewers, Deadline; Item: CustomerId, RoleId, Decision (SM-IAM-05), DecidedBy, DecidedOnUtc | IAM-011 | Revoke uses ICustomerService.RemoveCustomerRoleMappingAsync |
| AuthEvent / SuspiciousLoginFlag (new) | Event: Id, CustomerId, IdentifierTried, Type, Outcome, Channel, IpAddress, CountryIso, UserAgent, CreatedOnUtc; Flag: RuleId, CustomerId, EventIds, Status (SM-IAM-12), DecidedBy, Reason | IAM-012, IAM-018 | Native ActivityLog types PublicStore.SuccessfulLogin / FailedLogin / Logout enabled as well; copies in SEC-004 |
| CustomerPreference (new) | CustomerId, DefaultAddressId, PreferredPickupPointId (StorePickupPoint), PreferredChannel | IAM-014, IAM-015 | Native Address and StorePickupPoint reused |
| PolicyAcceptance (new) | CustomerId, VendorId (seller terms), PolicySystemName, VersionNo or "unversioned", Decision (accepted / declined / withdrawn), Channel, IpAddress, AgentId, consent scope for partner data sharing (PartnerId, Purpose, DataCategories; FIN-001 only), CreatedOnUtc | IAM-016 | Policy versions, text and the re-acceptance flag are the MKT-008 PolicyVersion (IC-MKT-03); IAM keeps no copy; native GdprLog keeps privacy-policy and consent entries |
| PrivacyRequest (new) | Id, CustomerId, Type (Export / Correction / Deletion), Field, CurrentValue, RequestedValue, Reason, Status (SM-IAM-06), DueOnUtc, DecidedBy, Outcome | IAM-017 | Native GdprLog entries written as well |
| VerificationCase (new) | Id, SubjectType, SubjectId, Country, IdentityType, AdapterSystemName, Result (SM-IAM-10), Reference, MatchedFields, DecidedBy, CreatedOnUtc | IAM-020 | No document images |
| Company / CompanyMember / CompanyAddress / CompanyOrder (new) | Company: Name, RegistrationNo, TaxNo, Status; Member: CompanyId, CustomerId, CompanyRole; Address: CompanyId, AddressId; Order link: CompanyId, OrderId, CostCentreId | IAM-022, IAM-027 | Native Customer.Company text field kept for display |
| TradeApplication (new) | Id, CustomerId, CompanyName, RegistrationNo, TaxNo, DocumentDownloadIds, Status (SM-IAM-07), DecidedBy, Reason | IAM-023 | Files stored as native Download records |
| AgentProfile / AssistedServiceRecord (new) | Agent: CustomerId, OutletIds (StorePickupPoint); Record: AgentId, OutletId, CustomerId, Action (register / act), StartedOnUtc, EndedOnUtc | IAM-026 | Native impersonation attribute and order note reused; the order link with agent and outlet is the CHK-013 AssistedOrder (not duplicated here) |
| CostCentre / Budget (new) | CostCentre: CompanyId, Name; Budget: CostCentreId, Period, Amount, Spent, OverrunAction | IAM-027 | |
| PasskeyCredential (new) | CustomerId, CredentialId, PublicKey, SignCount, CreatedOnUtc, LastUsedUtc | IAM-013 | |
| Native entities reused | Customer, CustomerRole, PermissionRecord, PermissionRecordCustomerRoleMapping, AclRecord, CustomerPassword, GdprConsent, GdprLog, ActivityLog, Address, GenericAttribute, Download | all | Not altered; IAM-008 admin query filtering is the only registered core change |


## 10. Configuration

### 10.1 Configuration-pack rows owned by this module (from the workbook "Config pack schema")

| Artefact | nopCommerce 5.00 source | Layers | Owning PRD | Pack |
|---|---|---|---|---|
| Customer roles, permissions, ACL | CustomerRole, PermissionRecord + PermissionRecordCustomerRoleMapping (definitions from IPermissionConfigManager / StandardPermission string system names, view/edit split since 4.90, unchanged in 5.00.1), AclRecord. Packs use 5.00.1 system names (for example Catalog.ProductsView; news, polls and forums use the plugin names News.Manage, Polls.Manage, Forums.Manage); 4.70 names (for example ManageProducts) are invalid and grant nothing. | global → vertical → client | IAM-007 / IAM-008 | Core |
| B2B pack settings | Company account roles, credit terms, price lists (native in 5.00: PriceList entities, catalogsettings.priceliststrategy; decision PRICE-500), approval limits | vertical (B2B pack) → client | IAM-022 / CHK-016 / CAT-039 | B2B trade pack |
| Further core setting groups | captchasettings.*, gdprsettings.*, multifactorauthenticationsettings.*, rewardpointssettings.*, localizationsettings.*, storeinformationsettings.* | global → client → store | SEC-013 / SEC-007 / IAM-004 / MKT-003 / PLT-009 / PLT-006 | Core |
| Assisted service pack settings | Agent roles, outlet assignment, receipt printer profile, cash-up rules | vertical (Assisted pack) → client | IAM-026 / CHK-013 / PAY-034 | Assisted service pack |
| Access and admin extensions pack settings | Delegation rules, passwordless/biometric options, guided-tour content | vertical → client | IAM-009 / IAM-013 / PLT-019 | Access and admin extensions pack |

### 10.2 Settings and client values

| Setting | Where it lives | Layer | KTDA (source) | Malawi Post (source) |
|---|---|---|---|---|
| Registration type | CustomerSettings.UserRegistrationType (native; installation-wide) | client | Not stated (public retail registration, CUS-003/004) | Not stated |
| Mobile registration and login enabled; buyer login factors | OtpSettings.LoginByPhoneEnabled (native, 5.00: code login); IAM settings (new: mobile registration without email, "SMS code" only) | client | Not stated | Required (FR-001, FR-002) |
| One-time code: validity, length, attempts, resend interval, send limits | OtpSettings.OtpTimeLife, OtpLength, OtpFailedAllowedAttempts, OtpCountAttemptsToSendCode, OtpTimeToRepeat (native, 5.00); limit per IP address: IAM setting (new) | client | Not stated | Not stated |
| SMS provider | MessagesSettings.ActiveSmsProviderSystemName (native, 5.00); provider plugin settings (Sms.Twilio or the CHN-005 aggregator adapter); credentials are secrets (BR-PLT-013) | client | Not stated | Not stated |
| Password rules | CustomerSettings.PasswordMinLength, PasswordMaxLength, PasswordRequire*, UnduplicatedPasswordsNumber, PasswordLifetime; CustomerRole.EnablePasswordLifetime (native) | global → client | Not stated | Configurable (FR-021); values not stated |
| Lockout | CustomerSettings.FailedPasswordAllowedAttempts, FailedPasswordLockoutMinutes, NotifyFailedLoginAttempt (native) | global → client | Not stated | Configurable (FR-021); values not stated |
| Recovery link validity; re-login after password change | CustomerSettings.PasswordRecoveryLinkDaysValid, RequiredReLoginAfterPasswordChange (native) | global → client | Not stated | Not stated |
| Sensitive roles and their recovery check | IAM settings (new) | client | Not stated | Not stated |
| Active MFA providers | MultiFactorAuthenticationSettings.ActiveAuthenticationMethodSystemNames (native); ForceMultifactorAuthentication = false (native, fixed by BR-IAM-030) | client | Not stated | Not stated |
| MFA-required roles | IAM settings (new) | client | Not stated | Privileged administrative roles (FR-012); list not stated |
| Idle timeout per user class; concurrent-session limit; limit action | IAM settings (new) | client | Not stated | Configurable (FR-013); values not stated |
| Authentication logging | Activity log types PublicStore.SuccessfulLogin / FailedLogin / Logout enabled; CustomerSettings.StoreIpAddresses = true (native) | global | Not stated | Required (FR-015) |
| Suspicious-login rules and thresholds; new-country notice | IAM settings (new) | client | Not stated | Not stated |
| Product role catalogue | Role system names of BR-IAM-050 (pack) | global | — | — |
| Client roles, permissions and ACL | CustomerRole, PermissionRecordCustomerRoleMapping, AclRecord (native; role pack) | vertical → client | Not stated (KG-16) | Not stated (MG-08) |
| Scope dimensions and region list | IAM settings (new) | client | Not stated (G-ORG) | Not stated (MG-08) |
| Delegable permissions | IAM settings (new) | client | Not stated | Not stated |
| Invitation validity; access-review reviewers and frequency; privileged-permission list | IAM settings (new) | client | Not stated | Not stated |
| Policy versions and re-acceptance flag | MKT-008 PolicyVersion.ReacceptanceRequired (read through IC-MKT-03; no IAM setting) | client → store | Not stated | Required on updates (FR-006) |
| Privacy-policy acceptance at registration; GDPR logging | CustomerSettings.AcceptPrivacyPolicyEnabled; GdprSettings.GdprEnabled, LogPrivacyPolicyConsent, LogUserProfileChanges (native) | country → client | Not stated | Not stated |
| Correction-request fields | IAM settings (new) | client | — | Orders and deliveries data (FR-018) |
| Account activity look-back; staff name or role shown to customers | IAM settings (new) | client | — | Not stated |
| Account synchronisation: fields, direction, system of record | IAM settings (new) | client | — | Not stated (MG-09) |
| Identity verification adapter per country; processes requiring KYC | IAM settings (new) | country → client | Not stated | Not stated (FR-344) |
| Trade application form and required documents | IAM settings (new) | vertical (B2B pack) → client | Not stated (PH-INF) | — |
| VAT number display | TaxSettings.EuVatEnabled, EuVatUseWebService = false, EuVatAllowVatExemption = false; Country.SubjectToVat (native) | country → client | Not stated (KG-06) | Not stated (MG-05) |
| Re-order allowed | OrderSettings.IsReOrderAllowed (native) | client → store | Not stated | Not stated |
| Agents and outlet assignment | AgentProfile (new); outlets from LOG-003 | client | — | Outlet agents (FR-014, FR-025) |
| Customer code required for acting sessions (agent reach is fixed: own outlet customers, BR-IAM-130) | IAM settings (new) | client | Not stated | Not stated |
| Rule providers to the impersonation filter | IC-IAM-09 providers registered by IAM-026 and CRM-015 (DI) | global | — | — |
| TRK category Security codes mandatory or not | TRK-006 category setting (TRK); checked by IAM through IC-TRK-06 CheckAllowed (BR-IAM-150) | client → country | Not stated | Not stated |
| Native permissions mapped to product roles; permission exclusions | Role pack (PLT-003) per BR-IAM-053, BR-IAM-054 | global → client | — | — |
| IAM key catalogue with secret flags | IAM plugin key catalogue (BR-IAM-140) | global | — | — |
| Company roles, budget overrun action | B2B pack settings (new) | vertical (B2B pack) → client | Not stated | — |

Runtime settings resolve at two levels only (store value, else shared value); global, country, vertical, client and store layers are merged by the pack loader at apply time in that order (BR-PLT-010; L1 §6.5).


## 11. Screens, user interface and messages

### 11.1 Screens

| Area | Screen | Features | Native or new |
|---|---|---|---|
| Storefront | Register (email) and Register with mobile number (code entry) | IAM-001, IAM-002, IAM-016 | Native page extended + new page |
| Storefront | Login (email and password, mobile number and code, passkey); MFA verification | IAM-001, IAM-002, IAM-004, IAM-013 | Native page extended |
| Storefront | Password recovery by email and by SMS; sensitive-account recovery | IAM-002, IAM-003 | Native page extended + new page |
| Storefront | Policy acceptance page | IAM-016 | New |
| Storefront — My account | Information, addresses with default, preferences (pickup point, channel), MFA, passkeys | IAM-004, IAM-013, IAM-014, IAM-015 | Native pages extended |
| Storefront — My account | Privacy (consents, export, correction request, deletion request); account activity; deactivate account | IAM-010, IAM-017, IAM-018 | Native GDPR tools extended + new tabs |
| Storefront — My account | Orders, invoices, quotes, returns, history export; home dashboard (P2) | IAM-021, IAM-025 | Native pages extended + new (P2) |
| Storefront — My account | Company members, company addresses, cost centres and budgets | IAM-022, IAM-027 | New (B2B pack) |
| Storefront | Trade-account application | IAM-023 | New (B2B pack) |
| Agent portal | Agent login, register customer, start and end acting session | IAM-026 | New (Assisted service pack) |
| Admin | Customers (search, edit, activate / deactivate, impersonate, account activity tab) | IAM-010, IAM-018 | Native page extended |
| Admin | Roles and permissions; ACL | IAM-007 | Native |
| Admin | Scopes, delegations, invitations, access-review campaigns, access audit report | IAM-008, IAM-009, IAM-011 | New |
| Admin | Sessions; authentication events and suspicious-login flags | IAM-006, IAM-012 | New |
| Admin | Consent and privacy trail; privacy request queue | IAM-016, IAM-017 | New |
| Admin | Trade applications and companies; agents and outlets; verification review queue | IAM-020, IAM-022, IAM-023, IAM-026 | New (account synchronisation messages of IAM-019 are shown in the INT-004 message log) |

Screen layouts are not specified here. They follow the approved designs (to be produced) and the client theme (PLT-006); until approved, developers build no layout of their own beyond the native nopCommerce admin and DefaultClean storefront patterns.


### 11.2 User-facing messages (locale resource keys)

| Key | Default English text (Proposed) | Used by |
|---|---|---|
| Iam.Otp.Sent | We sent a code by SMS. Enter it to continue. | AC-IAM-002-01-01 |
| Iam.Otp.Expired | This code has expired. Request a new code. | AC-IAM-002-01-05 |
| Iam.Otp.TooManyAttempts | Too many wrong codes. Request a new code later. | AC-IAM-002-01-04 |
| Iam.Otp.Unavailable | We cannot send a code right now. Please try again later. | AC-IAM-002-01-06 |
| Iam.PhoneInUse | This mobile number already has an account. Please log in. | AC-IAM-002-01-03, AC-IAM-026-02-02 |
| Iam.RecoveryRequestReceived | If an account exists for these details, we have sent instructions. | AC-IAM-003-04-01 |
| Iam.MfaRequired | Your role requires a second login check. Set it up to continue. | AC-IAM-004-01-01 |
| Iam.SessionExpired | You were logged out because you were inactive. Please log in again. | AC-IAM-006-01-01 |
| Iam.SessionLimitReached | You are logged in on too many devices. Log out elsewhere and try again. | AC-IAM-006-02-01 |
| Iam.ScopeDenied | You do not have access to this item. | AC-IAM-008-01-02, AC-IAM-008-01-03, AC-IAM-026-03-02, AC-IAM-026-03-03 |
| Iam.DelegationNotAllowed | You cannot delegate this permission. | AC-IAM-009-01-02 |
| Iam.AccountDeactivated | Your account is deactivated. You can reactivate it at any time. | AC-IAM-010-04-01 |
| Iam.AccountReactivated | Your account is active again. | AC-IAM-010-04-02 |
| Iam.ContactSupport | Please contact us to reactivate this account. | AC-IAM-010-04-03 |
| Iam.Invitation | You are invited to an account. Open the link to set your password and finish set-up. | AC-IAM-011-01-01 (default text of message template Iam.Invitation.Email) |
| Iam.InvitationExpired | This invitation is no longer valid. Ask for a new invitation. | AC-IAM-011-01-03 |
| Iam.NewCountryLogin | We noticed a login to your account from a new country. | AC-IAM-012-02-02 (SMS text; the email uses message template Iam.NewCountryLogin.CustomerNotification) |
| Iam.TermsUpdated | Our terms have changed. Please read and accept them to continue. | AC-IAM-016-02-01 |
| Iam.TermsDeclined | You have been logged out because the new terms were not accepted. | AC-IAM-016-02-02 |
| Iam.CorrectionRequestReceived | We received your correction request and will reply by the date shown. | AC-IAM-017-03-01 |
| Iam.PickupPointUnavailable | Your preferred pickup point is no longer available. Please choose another. | AC-IAM-015-01-02 |
| Iam.TradeApplicationReceived | Thank you. We will review your trade account application. | AC-IAM-023-01-01 |
| Iam.TradeApplicationApproved | Your trade account is approved. | AC-IAM-023-02-01 (SMS text; the email uses message template Iam.TradeApplicationApproved.CustomerNotification) |
| Iam.AgentNotAssigned | You are not assigned to an outlet. Contact your administrator. | AC-IAM-026-04-01 |
| Iam.ProductRoleProtected | This role is used by product modules. Its system name cannot be changed and it cannot be deleted. | AC-IAM-007-04-03 |
| Iam.PermissionExcluded | This permission cannot be given to this role. | AC-IAM-007-04-05 |
| Iam.ImpersonationNotAllowed | You cannot act for this customer. | AC-IAM-010-03-02 |
| Iam.BudgetExceeded | This order exceeds the remaining budget of the cost centre. | AC-IAM-027-01-02 |

Default English text is Proposed. Every key is a locale resource (Definition of Done criterion 8); client language packs translate it. Native locale keys quoted in criteria (for example Account.Login.WrongCredentials) are reused unchanged. Emails are MessageTemplate entities sent by TRK-005 (BR-IAM-150): native templates through IWorkflowMessageService, IAM templates registered with the TRK-005 engine through IC-TRK-04; a locale key alone sends nothing. One-time codes go to CHN-005 through IC-IAM-01.


## 12. Integrations, contracts, events and concurrency

### 12.1 External interfaces

| Interface | Operations | Counterpart | Note |
|---|---|---|---|
| SMS gateway (IAM-002, IAM-004, IAM-026) | Send one-time code (IC-IAM-01; native code login through ISmsService) | PRD-CHN-005 SMS gateway, registered as the active native ISmsProvider (5.00); bundled Sms.Twilio only if accepted | Gateway vendor not named; Twilio acceptance and Kenya / Malawi coverage Not stated in source |
| Identity providers (IAM-005, P2) | OpenID Connect / SAML 2.0 sign-in; provisioning (IC-IAM-04) | Not named in source | Native IExternalAuthenticationMethod framework |
| Client core systems (IAM-019) | Publish and receive account changes (IC-IAM-03) | Malawi Post core systems through the Integration Layer (INT-002) | Systems and interface not stated (MG-09) |
| Identity registries and mobile-network KYC (IAM-020) | Verify, GetCapabilities (IC-IAM-02) | Not named in source | Could priority (FR-344) |
| Security monitoring (IAM-012) | Authentication event export | SEC-005 export (IC-SEC-02) | System not named |
| IP geolocation (IAM-012) | Country of the login IP address | Native IGeoLookupService with bundled GeoLite2-Country database | Database update process: Not stated |

### 12.2 Interface contracts

| Contract | Operation | Inputs | Outputs | Errors | nopCommerce mapping |
|---|---|---|---|---|---|
| IC-IAM-01 | SendCode | Mobile number (international format), purpose, language, store | Message id, accepted / rejected | Gateway unavailable, number invalid, send limit reached, blocked by TRK-006 (IC-TRK-06 CheckAllowed answered Blocked) | Call to the PRD-CHN-005 SMS service from the IAM plugin after IC-TRK-06 CheckAllowed (BR-IAM-150); the code itself is generated and hashed by IAM, never by the gateway |
| IC-IAM-02 | Verify | Country, subject type (person / organisation), identity type, identity number, name, date of birth or mobile number as the adapter declares | Verified / NotVerified / Inconclusive / Unavailable, adapter reference, matched fields | Unsupported identity type, registry unavailable, timeout | IAM adapter interface (new, not a nopCommerce interface); adapters are plugins registered for one or more countries. The four result values are the product standard (owner decision); SEL-004 calls Verify directly and maps Inconclusive to manual review (BR-SEL-007) |
| IC-IAM-02 | GetCapabilities | — | Countries and identity types supported, mobile-money KYC support flag | — | Same adapter interface |
| IC-IAM-03 | PublishAccountChange | Customer GUID, change type (created / updated / deactivated / deleted), changed fields, version | Acknowledged / rejected with reason | Integration Layer unavailable, validation error | Called by the INT-004 delivery task for IntegrationMessage records of channel "account sync" (BR-IAM-100); the adapter reaches the client core systems through the INT-002 Integration Layer |
| IC-IAM-03 | ReceiveAccountChange | Customer GUID or external id, fields, version, source system | Applied / ignored / conflict | Unknown customer, field not configured | Plugin endpoint behind the Integration Layer; updates through ICustomerService |
| IC-IAM-04 | Provision (P2) | Create, update, deactivate user; group membership | Customer id, status | Unknown group, duplicate email | Plugin endpoint (protocol Proposed, for example SCIM); updates through ICustomerService and ICustomerRegistrationService |
| IC-IAM-05 | RecordAcceptance (IAM-016, SEL-006, IAM-026, CHK-009, FIN-001 → IAM) | Customer, vendor (seller terms only), policy system name, version (from IC-MKT-03, or "unversioned"), decision (accepted / declined / withdrawn), channel, IP address, agent; for a partner data-sharing consent (FIN-001) also partner, purpose and data categories | Acceptance id | Unknown policy; version not Effective; withdrawal without an earlier acceptance of the same scope | IAM service; writes PolicyAcceptance and AUD-IAM-012; the caller keeps only the returned id (CHK-009 order link, FIN referral); consent scope Proposed (decision ONE-RECORD) |
| IC-IAM-05 | GetActiveConsent (FIN-001 → IAM) | Customer, policy system name, partner, purpose | The latest accepted and not withdrawn consent of that scope with its data categories, or none | — | IAM read service over PolicyAcceptance; FIN sends data only under an active consent (BR-FIN-002) |
| IC-IAM-05 | HasAcceptedCurrent | Customer or vendor, policy system name | true / false, accepted version | — | IAM service; used by SEL-006 activation checks and the re-acceptance filter |
| IC-IAM-05 | GetConsentTrail (CRM-003 → IAM) | Customer, period | PolicyAcceptance rows and GDPR log consent entries (ConsentAgree, ConsentDisagree), time ordered, read-only | Caller lacks Identity.Core.ConsentTrail.View | IAM read service over PolicyAcceptance and native GdprLog |
| IC-IAM-06 | GetApprovalAuthority (ADM-006 → IAM) | User, permission system name, time | Roles, value-band limit (IAM-008 scope) and active delegations received (delegator, permission, end) | — | IAM read service over ScopeAssignment and Delegation |
| IC-IAM-07 | GetCompanyOfCustomer (CAT, CHK → IAM) | Customer | CompanyId, company status, company role, or no company | — | IAM read service (B2B pack) |
| IC-IAM-07 | OnMembershipChanged (IAM → registered providers, for example CAT-040) | CompanyId, customer, change (added / removed / role changed) | Done / failed | Provider failure (the membership change is not saved) | Provider interface defined by IAM; providers registered in DI; called inside the membership save |
| IC-IAM-09 | EvaluateImpersonation (IAM impersonation filter → registered rule providers: IAM-026 agent rule, CRM-015 account-manager rule) | Acting user, customer, store, posted form values (customer code) | Allow / NotApplicable / Deny with message key and reason | Provider exception (treated as Deny, logged) | Provider interface defined by IAM; providers registered in DI and resolved as a list; called only by the single IAM global action filter on Admin CustomerController.Impersonate (BR-IAM-130); a provider never adds its own filter to the action |
| IC-IAM-08 | ErasePersonalData / ConsentWithdrawn (IAM → registered providers, for example SRC) | Customer id and GUID; or customer and consent system name | Erased / failed with reason; acknowledged | Provider failure (request stays InProgress) | Provider interface defined by IAM; called inside the IGdprService.PermanentDeleteCustomerAsync override and on consent withdrawal |

Operation signatures (C# interfaces) are produced at L2 build start and approved by the tech lead; this table fixes the operations and their nopCommerce mapping. Authentication events are exported to security monitoring through the SEC contract IC-SEC-02; IAM defines no separate export interface.

### 12.3 Events

| Module event | Native nopCommerce event / mechanism | Consumers / effect |
|---|---|---|
| Account.Registered | CustomerRegisteredEvent (native, raised by registration) | IAM-019 writes an INT-004 IntegrationMessage (enqueue only); welcome notifications are native templates sent by TRK-005 |
| Account.Changed / Deactivated | EntityUpdatedEvent<Customer> (native entity event) | IAM-019 writes an INT-004 IntegrationMessage (enqueue only); SEC-004 records the change through the repository decorator, not through this event |
| Account.Deleted | CustomerPermanentlyDeleted (native, raised by GdprService) | IAM-019 erasure notice (INT-004 IntegrationMessage); IAM plugin tables anonymised inside the IGdprService override, not in the consumer |
| Auth.LoginSucceeded / LoginFailed / LoggedOut | Native activity types PublicStore.SuccessfulLogin / FailedLogin / Logout; IAM AuthEvent written in the IAM services (not in a consumer) | IAM-012 rules, IAM-018, SEC-004, SEC-005 |
| Auth.SuspiciousLogin | None (IAM event) | Security officer notification, SEC-005 |
| Policy.VersionPublished | MKT plugin event (IC-MKT-03); MKT-008 owns versions and the re-acceptance flag | IAM-016 consumer only refreshes its cached Effective version and flag; the filter reads IC-MKT-03 |
| Order placed in an acting session | OrderPlacedEvent (native); native order note written inside PlaceOrderAsync | CHK-013 owns the AssistedOrder record; IAM adds no consumer |
| Company.MembershipChanged | None (IAM provider call IC-IAM-07, not an event, because event consumers cannot block) | CAT-040 per-company role mapping |

Event consumers in nopCommerce swallow exceptions (L1 §6.2 principle 8): money-moving logic runs in services, not in consumers; consumers only notify or enqueue jobs.

### 12.4 Concurrency and timing cases

| Case | Features | Required behaviour |
|---|---|---|
| Two registrations with the same mobile number at the same time | IAM-002 | Unique index on PhoneIdentity.NormalisedPhone; the second insert fails and the visitor sees Iam.PhoneInUse |
| The same code entered twice in parallel | IAM-002, IAM-004 | Code verification runs under ILocker.PerformActionWithLockAsync keyed 'iam-otp-{ChallengeId}'; the second request finds the challenge Verified and is refused |
| Two sign-ins of one user at the limit of concurrent sessions | IAM-006 | Session creation runs under ILocker key 'iam-session-{CustomerId}' (distributed when DistributedCacheConfig.Enabled; per host otherwise, L1 §6.4); the second sign-in re-reads the count |
| Forced logout while the user is mid-request | IAM-006 | The running request completes; every later request is rejected because RequireReLogin is set and the session is Revoked |
| Delegation ends while the delegate is approving | IAM-009 | The permission is checked at save time; a save after the end time is refused |
| Correction approved while the customer edits the same field | IAM-017 | The later save wins; both changes are in the audit trail (SEC-004); the reviewer sees the current value before approving (Proposed) |
| Inbound synchronisation and a local change of the same field | IAM-019 | Version compare on the inbound change against the version of the last IntegrationMessage sent for the customer; the configured system of record wins; the conflict is logged |


## 13. Notifications

| Trigger | Recipient | Channel | Feature |
|---|---|---|---|
| Registration by mobile number completed | Shopper | SMS | IAM-002 |
| Login from a new country | Customer | Email (template Iam.NewCountryLogin.CustomerNotification) or SMS | IAM-012 |
| Suspicious-login flag raised | Security officer | Admin notification + email | IAM-012 |
| Failed login on an existing account (native) | Customer | Email Customer.FailedLoginAttempt | IAM-003 |
| Invitation | Invitee | Email (template Iam.Invitation.Email, new; text from locale key Iam.Invitation) | IAM-011 |
| Access-review campaign opened / overdue | Reviewer / administrators | Email + admin notification | IAM-011 |
| New policy version requiring acceptance | Registered users | On next request (redirect); optional email | IAM-016 |
| Privacy request received / completed / rejected / overdue | Shopper; privacy officer (overdue) | Email or SMS | IAM-017 |
| Trade application decision | Applicant | Email (template Iam.TradeApplicationApproved.CustomerNotification) + SMS | IAM-023 |
| Account deactivated / reactivated | Customer | Email or SMS | IAM-010 |
| Synchronisation message dead-lettered | Administrators | INT-004 dead-letter notification (INT owns it) | IAM-019 |


## 14. Reports and audit

### 14.1 Reports

| Report | Feature | Basis |
|---|---|---|
| Access audit report (role assignments, privileged accounts, MFA status) | IAM-011 | REQ-MPC-FR-298 |
| Authentication events and suspicious-login flags | IAM-012 | REQ-MPC-FR-015 |
| Consent and terms-acceptance trail | IAM-016, IAM-017 | REQ-MPC-FR-022 |
| Privacy requests with due dates and outcomes | IAM-017 | Inference from REQ-KTDA-LEG-001 |
| Assisted service by agent and outlet | IAM-026 | REQ-MPC-FR-025 |
| Access-review campaign results | IAM-011 | FC-M10-013 |

### 14.2 Audit event catalogue

| ID | Event | Actor | Entity | Fields recorded |
|---|---|---|---|---|
| AUD-IAM-001 | One-time code issued / verified / locked | System | OtpChallenge | purpose, masked number, outcome |
| AUD-IAM-002 | Account recovered (email link or SMS code) | Customer | Customer | method, IP address |
| AUD-IAM-003 | Sensitive-account recovery decision | Customer / confirming user | RecoveryRequest | method, outcome, confirmer |
| AUD-IAM-004 | MFA provider set up or removed | Customer / administrator | Customer | provider, actor |
| AUD-IAM-005 | Session revoked or forced logout | Security officer / system | UserSession | sessions affected, reason |
| AUD-IAM-006 | Role, permission, ACL or scope change; scope denial | Administrator / system | CustomerRole, mapping, ScopeAssignment | old values, new values (entity diff in SEC-004) |
| AUD-IAM-007 | Delegation created, ended or revoked | Delegator / administrator / system | Delegation | delegator, delegate, permission, dates |
| AUD-IAM-008 | Account activated, deactivated or reactivated | Customer / staff / identity provider | Customer | old status, new status, reason |
| AUD-IAM-009 | Access-review decision | Reviewer | AccessReviewItem | decision, role, customer |
| AUD-IAM-010 | Staff read access to customer personal data | Staff user | Customer | page, customer, time |
| AUD-IAM-011 | Privacy request decision; erasure executed | Privacy officer / staff | PrivacyRequest, Customer | type, outcome, fields changed (names only) |
| AUD-IAM-012 | Policy accepted or declined | Customer / agent | PolicyAcceptance | policy, version, channel |
| AUD-IAM-013 | Trade application decision | Sales staff | TradeApplication | decision, reason, role given |
| AUD-IAM-014 | Assisted registration; acting session started or ended | Agent | AssistedServiceRecord | agent, outlet, customer |
| AUD-IAM-015 | Identity verification result or manual decision | System / reviewer | VerificationCase | adapter, result, reference, reason |
| AUD-IAM-016 | Suspicious-login flag raised, confirmed or dismissed | System / security officer | SuspiciousLoginFlag | rule, events, decision, reason |
| AUD-IAM-017 | Invitation sent, accepted or revoked | Administrator / invitee | Invitation | email, roles, outcome |
| AUD-IAM-018 | Authentication event | Customer / system | AuthEvent | type, outcome, IP address, channel |
| AUD-IAM-019 | Acting session (impersonation) refused by the impersonation filter | Staff user / agent / account manager | Customer | actor, customer, deciding provider, message key |

All audit events go to the platform audit trail (PRD-SEC-004, IRepository<> decorator plus the IC-SEC-01 business-event call). Entity changes are captured automatically with old and new values; the AUD-IAM events add the business meaning. Names and fields are Proposed. Code hashes and security answers are never written to the audit trail.


## 15. Non-functional requirements

| ID | Requirement | Basis | Verified by |
|---|---|---|---|
| NFR-IAM-001 | One-time codes, security answers and invitation tokens are stored only as hashes and never logged in clear. | NFR-X-001; BR-IAM-012 | T-IAM-05 |
| NFR-IAM-002 | Authentication events are complete for the event types of AC-IAM-012-01-02 and cannot be edited or deleted in the product. | REQ-MPC-FR-015 | AC-IAM-012-01-02, AC-IAM-012-01-03 |
| NFR-IAM-003 | Idle timeout and forced logout are enforced on the server for every request, not only by cookie lifetime. | REQ-MPC-FR-013 | AC-IAM-006-01-03, AC-IAM-006-03-01 |
| NFR-IAM-004 | Code sending is limited per number and per IP address to prevent SMS abuse (limits are settings, defaults not stated). | Proposed; BR-IAM-012 | T-IAM-02 |
| NFR-IAM-005 | All user-facing text is in locale resources (NFR-X-004). | NFR-X-004 | §11.2 |
| NFR-IAM-006 | Response time for login and code delivery: Not stated in source — requires confirmation. | NFR-X-009 | — (no target) |

Cross-cutting NFR-X-001 to NFR-X-009 (L1 §8.3) also apply.


## 16. Dependencies, phase and build order

| PRD ID | Phase | Depends on | Needed by |
|---|---|---|---|
| PRD-IAM-001 | P1 | — | |
| PRD-IAM-002 | P1 | PRD-CHN-005 | |
| PRD-IAM-003 | P1 | — | |
| PRD-IAM-004 | P1 | — | |
| PRD-IAM-005 | P2 | — | |
| PRD-IAM-006 | P1 | — | |
| PRD-IAM-007 | P1 | — | |
| PRD-IAM-008 | P1 | — | |
| PRD-IAM-009 | P2 | — | |
| PRD-IAM-010 | P1 | — | |
| PRD-IAM-011 | P1 | — | |
| PRD-IAM-012 | P1 | PRD-SEC-004 | |
| PRD-IAM-013 | P2 | — | |
| PRD-IAM-014 | P1 | — | |
| PRD-IAM-015 | P1 | — | |
| PRD-IAM-016 | P1 | — | |
| PRD-IAM-017 | P1 | PRD-SEC-012 | |
| PRD-IAM-018 | P1 | — | |
| PRD-IAM-019 | P1 | — | |
| PRD-IAM-020 | P1 | — | PRD-SEL-004 |
| PRD-IAM-021 | P1 | — | |
| PRD-IAM-022 | P1 | — | PRD-IAM-027, PRD-CAT-039, PRD-CAT-040, PRD-CHK-016, PRD-CHK-018 |
| PRD-IAM-023 | P1 | — | |
| PRD-IAM-024 | P1 | — | |
| PRD-IAM-025 | P2 | — | |
| PRD-IAM-026 | P1 | — | |
| PRD-IAM-027 | P2 | PRD-IAM-022 | |

Build order inside the module follows dependencies: the connector frameworks first, then adapters, then features that consume them. The Product Owner orders the Product Backlog; this list is not an order.


## 17. Test notes

| ID | Test note |
|---|---|
| T-IAM-01 | Registration: every registration type (Standard, EmailValidation, AdminApproval, Disabled) and mobile registration, including duplicate email and duplicate mobile number. |
| T-IAM-02 | One-time codes: success, wrong code, expiry, too many attempts, resend interval, send limits per number and per IP address, parallel verification of the same code. |
| T-IAM-03 | Phone-only account: sign-in, later requests, password change and deletion all work without an email address (BR-IAM-011). |
| T-IAM-04 | MFA by role: a member of an MFA-required role is forced to set up MFA; a buyer is not; ForceMultifactorAuthentication is off; each provider succeeds and fails correctly. |
| T-IAM-05 | Secrets: database and logs contain no code, security answer or invitation token in clear after test runs. |
| T-IAM-06 | Sessions: idle timeout with and without "remember me", concurrent limit, forced logout ends every cookie of the user. |
| T-IAM-07 | Permissions: each permission in §4 has an allow and a deny case (§4.1); product roles of BR-IAM-050 exist after installation with exact system names; a pack with a 4.70 permission name, or a 4.90 name removed in 5.00 (ContentManagement.NewsView), is rejected. |
| T-IAM-08 | Scopes and delegation: list filtering, direct-address access, value band, delegation start, end and revoke, segregation of duties under delegation. |
| T-IAM-09 | Erasure: after deletion no personal field of BR-IAM-092 remains on the customer record or in IAM tables; orders are kept per retention. |
| T-IAM-10 | State models: every transition in §8.2 is tested; every transition not listed is rejected. |
| T-IAM-11 | Assisted service: registration and acting session need the customer code where set; orders carry the native order note naming the agent; agents cannot act for staff or for customers outside their reach; the single impersonation filter allows Administrators, agents for their own outlet customers and account managers for their assigned customers (IC-IAM-09 providers), and refuses every other holder of Customers.CustomersImpersonation; no second filter is registered on the action. |
| T-IAM-12 | Role catalogue: every role system name used as a default role or actor role in any module content file is in BR-IAM-050 (scripted check over tools/l2_content); catalogue roles survive deletion attempts and are re-created at start. |
| T-IAM-13 | Contracts IC-IAM-05 to IC-IAM-09: acceptance with MKT-008 version, consent trail permission check, authority and delegation read, membership provider failure rolls back, erasure provider failure keeps the request open. |
