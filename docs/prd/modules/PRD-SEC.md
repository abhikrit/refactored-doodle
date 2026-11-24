# L2 Module PRD — SEC: Security, audit and compliance

<!-- Single source. The Word file is generated from this Markdown by tools/md2docx.py. -->

## 1. Document control

| Item | Value |
|---|---|
| Module | SEC — Security, audit and compliance |
| Version | 1.0 |
| Status | Draft. Not approved. |

**How to read the labels.** Every story, rule and criterion names its basis: **D** = the feature description; **REQ-…** = a client requirement delivered by that feature; **FC-…** = a catalog feature; **FIT** = verified nopCommerce 5.00.1 behaviour; a decision ID. "see XXX-nnn (REQ-…)" points to a requirement delivered by another feature. **Proposed** = a product design choice that needs Product Owner approval. "Not stated in source — requires confirmation" marks a value the product does not fix; developers do not fill it. Gap IDs: KG-nn = KTDA, MG-nn = Malawi Post.

## 2. Purpose and scope

Keeps the platform and its data secure and accountable: encrypted traffic and stored data, no card data, protection at the edge, a tamper-evident platform audit trail with old and new values that every module writes to, consent and privacy tools, a country data-protection profile with the processing register, transfer records, impact assessments and deadlines, a breach notification workflow, auditor read-only access, bot protection, data classification and masking, and the hand-offs to external security services (security monitoring, vulnerability management, incident management, certification evidence).

**In scope**

- Transport and storage encryption, password hashing, no card storage, edge protection, access control for uploaded files and PCI-DSS scope control (SEC-001 to SEC-003)
- Platform audit trail: capture of every change with old and new values through an IRepository<> decorator, business events from all modules, hash chain, search, export with attestation, replay (SEC-004)
- Export to external security monitoring for anomaly and correlation detection (SEC-005, P2)
- Data residency per client instance (SEC-006, held by DP-01)
- Consent and privacy tools: cookie categories, marketing consent logging, native GDPR tools configuration (SEC-007)
- Breach notification workflow and the country data-protection profile: processing register, transfers, impact assessments, request and breach deadlines (SEC-008, SEC-012)
- Compliance evidence export and audit certificates (SEC-009, P2); auditor read-only access (SEC-010, P2)
- Vulnerability management gate, pen-test tracking hand-off and the known-findings scope (SEC-011); bot protection, including the TRK tracking lookup (SEC-013)
- Data classification and masking (SEC-014, P2); security incident management hand-off (SEC-015, P2)

**Not in this module**

| Item | Where it is |
|---|---|
| Customer-facing privacy requests (export, correction, deletion) and terms acceptance | IAM module (PRD-IAM-016, IAM-017); SEC-012 supplies the deadlines |
| Authentication events and suspicious-login rules | IAM module (PRD-IAM-012); SEC-004 stores copies, SEC-005 exports them |
| Settings change approval (maker-checker) | PLT module (PRD-PLT-004); SEC-004 records the changes |
| Data retention rules and archival | PLT module (PRD-PLT-020); SEC-012 references them |
| Approval workflow for high-risk actions | SEL module (PRD-SEL-005, payout account changes) and ADM module (PRD-ADM-006); SEC-004 records the trail |
| Compliance and audit reports for regulators (BI) | RPT module (PRD-RPT-006); it reads SEC-004 exports |
| E-transactions consumer controls (country law profile, e-transaction part) | CHK module (PRD-CHK-009); same profile entity, owned by SEC-012 |
| Fraud case management | Not delivered by any SEC feature: SEC-005 only exports events to an external security-monitoring system (carried to PAY) |
| TLS certificates and custom domains | PLT module (PRD-PLT-007) |
| Extension register of DI overrides and global action filters | ADM module (BR-ADM-001, decision OVR-REG); SEC-owned entries in BR-SEC-070 |
| Server-side file type and size checks for uploads | ADM module (PRD-ADM-008, BR-ADM-060) |
| Hosting, WAF / DDoS service, database encryption at rest, security-monitoring system, vulnerability scanners, incident tool, GRC tool | External systems and project services (ORG-SVC); not named in source |
| Certification (SOC 2, ISO 27001), ODPC registration, penetration tests | Organisational services (ORG-SVC, DP-01) |

## 3. Feature summary

| PRD ID | Feature | Channel | Phase | Implementation | Code change | Pack | Depends on | Held by |
|---|---|---|---|---|---|---|---|---|
| PRD-SEC-001 | Encryption and transport security | Platform / back-office | P1 | Configuration | None | Core (always on) | PRD-PLT-007 | |
| PRD-SEC-002 | Edge protection | Platform / back-office | P1 | External system | External system + integration plugin | Core (always on) | | |
| PRD-SEC-003 | PCI-DSS scope control | Platform / back-office | P1 | Configuration | None | Core (always on) | | |
| PRD-SEC-004 | Platform audit trail | Platform / back-office | P1 | Code-level | Custom plugin (DI override) | Core (always on) | | |
| PRD-SEC-005 | Anomaly and correlation detection | Platform / back-office | P2 | External system | External system + integration plugin | Core (always on) | | |
| PRD-SEC-006 | Data residency | Platform / back-office | P1 | External system | External system + integration plugin | Core (always on) | | DP-01 |
| PRD-SEC-007 | Consent and privacy tools | Platform / back-office | P1 | Configuration | None | Core (always on) | PRD-SEC-012 | |
| PRD-SEC-008 | Breach notification workflow | Platform / back-office | P1 | Code-level | Custom plugin | Core (always on) | PRD-SEC-012 | |
| PRD-SEC-009 | Compliance reports and certificates | Platform / back-office | P2 | External system | External system + integration plugin | Core (always on) | | |
| PRD-SEC-010 | Auditor read-only access | Platform / back-office | P2 | Code-level | Custom plugin | Core (always on) | | |
| PRD-SEC-011 | Vulnerability management | Platform / back-office | P1 | External system | External system + integration plugin | Core (always on) | | |
| PRD-SEC-012 | Country data-protection pack | Platform / back-office | P1 | Code-level | Custom plugin | Core (always on) | | |
| PRD-SEC-013 | Bot protection | Platform / back-office | P1 | Configuration | None | Core (always on) | | |
| PRD-SEC-014 | Data classification and masking | Platform / back-office | P2 | Code-level | Custom plugin + Theme/view override | Core (always on) | PRD-SEC-006 | DP-01 |
| PRD-SEC-015 | Security incident management | Platform / back-office | P2 | External system | External system + integration plugin | Core (always on) | | |

## 4. Actors and permissions

| Actor | What they do in this module | Role in nopCommerce |
|---|---|---|
| Shopper / visitor | Chooses cookie categories; receives breach notices when affected | Guests / Registered (native) |
| Client administrator | Configures security, captcha, GDPR and cookie settings; grants auditor access | Administrators (native) |
| Auditor | Searches, replays and exports the audit trail with read-only access for a set period | Role system name "Auditor" (Proposed; BR-IAM-050) |
| Security officer | Receives chain-break and export-failure alerts; links incidents | Role system name "SecurityOfficer" (Proposed; BR-IAM-050) |
| Privacy officer | Maintains the country profile, processing register, transfer and impact-assessment records; runs breach cases | Role system name "PrivacyOfficer" (Proposed; BR-IAM-050) |
| Module services (system) | Write business audit events (AUD-<AREA>-nnn) through IC-SEC-01 | All product plugins |
| Platform team | Runs dependency scans, fixes findings, keeps the interception register | Not a runtime role |
| Hosting provider (external) | TLS termination, WAF and DDoS protection, encryption at rest, region | Project service; not named in source |
| Security-monitoring system (external) | Receives event exports, correlates, alerts | Not named in source |
| Data-protection regulator (external) | Receives breach notifications | Kenya: ODPC (named in decision DP-01 text); Malawi: Not stated in source |

| Permission (system name) | Category | Allows | Default roles |
|---|---|---|---|
| Security.Core.AuditTrail.View | Security | Search the audit trail, view entity history, run replay and integrity verification (SEC-004, SEC-010) | Administrators, Auditor |
| Security.Core.AuditTrail.Export | Security | Export audit records with an integrity manifest (SEC-004, SEC-009) | Administrators, Auditor |
| Security.Core.AuditorAccess.CreateEditDelete | Security | Grant, change and revoke time-boxed auditor access (SEC-010) | Administrators |
| Security.Core.Breaches.View | Security | View breach cases (SEC-008) | Administrators, PrivacyOfficer |
| Security.Core.Breaches.CreateEditDelete | Security | Create and run breach cases, generate affected lists, send notices (SEC-008) | PrivacyOfficer |
| Security.Core.PrivacyProfile.View | Security | View the country profile, processing register, transfers and impact assessments (SEC-012) | Administrators, PrivacyOfficer, Auditor |
| Security.Core.PrivacyProfile.CreateEditDelete | Security | Maintain the country profile, processing register, transfers and impact assessments (SEC-012, SEC-006) | PrivacyOfficer |
| Security.Core.DataClassification.CreateEditDelete | Security | Classify fields and set masking rules (SEC-014) | Administrators, PrivacyOfficer |
| Security.Core.UnmaskedData.View | Security | See masked values in full, each reveal being logged (SEC-014) | Administrators |
| Security.Core.SecurityExport.CreateEditDelete | Security | Configure the security-monitoring export and view its queue (SEC-005, SEC-015) | Administrators, SecurityOfficer |
| Configuration.ManageSettings (native) | Configuration | Edit security, captcha, GDPR and store-information settings, including cookie categories (SEC-001, SEC-007, SEC-013) | Administrators |
| Customers.ActivityLogView (native) | Customers | View the native activity log (SEC-010 read-only role) | Administrators |
| System.ManageSystemLog (native) | System | View and clear the native system log | Administrators |

Native permissions are reused where they exist. New permissions are declared in a SEC plugin class implementing IPermissionConfigManager (pattern: Misc.RFQ RfqPermissionConfigManager), with system names prefixed by the plugin system name (Proposed: Security.Core) and the native view / create-edit-delete split (unchanged in 5.00.1: Libraries/Nop.Services/Security/StandardPermission.cs); Category is Security (native set). Default roles are given by system name from the product role catalogue (BR-IAM-050); a missing catalogue role is created by the IAM plugin at install and at start (BR-IAM-050), not by native start-up, which creates a role only when it installs a new permission. No permission allows editing or deleting audit events. The read-only Auditor role is built from native *View permissions plus Security.Core.AuditTrail.View and is time-boxed through the single IAM override of IPermissionService (BR-IAM-060). All new names are Proposed.

### 4.1 Standard permission criteria

| ID | Criterion | Basis |
|---|---|---|
| AC-SEC-PERM-01 | **Given** a user without Security.Core.AuditTrail.View, **when** they open or post any function it guards, **then** access is denied and nothing changes; **given** a user with it, the function is available. | Proposed (T-05) |
| AC-SEC-PERM-02 | **Given** a user without Security.Core.AuditTrail.Export, **when** they open or post any function it guards, **then** access is denied and nothing changes; **given** a user with it, the function is available. | Proposed (T-05) |
| AC-SEC-PERM-03 | **Given** a user without Security.Core.AuditorAccess.CreateEditDelete, **when** they open or post any function it guards, **then** access is denied and nothing changes; **given** a user with it, the function is available. | Proposed (T-05) |
| AC-SEC-PERM-04 | **Given** a user without Security.Core.Breaches.View, **when** they open or post any function it guards, **then** access is denied and nothing changes; **given** a user with it, the function is available. | Proposed (T-05) |
| AC-SEC-PERM-05 | **Given** a user without Security.Core.Breaches.CreateEditDelete, **when** they open or post any function it guards, **then** access is denied and nothing changes; **given** a user with it, the function is available. | Proposed (T-05) |
| AC-SEC-PERM-06 | **Given** a user without Security.Core.PrivacyProfile.View, **when** they open or post any function it guards, **then** access is denied and nothing changes; **given** a user with it, the function is available. | Proposed (T-05) |
| AC-SEC-PERM-07 | **Given** a user without Security.Core.PrivacyProfile.CreateEditDelete, **when** they open or post any function it guards, **then** access is denied and nothing changes; **given** a user with it, the function is available. | Proposed (T-05) |
| AC-SEC-PERM-08 | **Given** a user without Security.Core.DataClassification.CreateEditDelete, **when** they open or post any function it guards, **then** access is denied and nothing changes; **given** a user with it, the function is available. | Proposed (T-05) |
| AC-SEC-PERM-09 | **Given** a user without Security.Core.UnmaskedData.View, **when** they open or post any function it guards, **then** access is denied and nothing changes; **given** a user with it, the function is available. | Proposed (T-05) |
| AC-SEC-PERM-10 | **Given** a user without Security.Core.SecurityExport.CreateEditDelete, **when** they open or post any function it guards, **then** access is denied and nothing changes; **given** a user with it, the function is available. | Proposed (T-05) |
| AC-SEC-PERM-11 | **Given** a user without Configuration.ManageSettings (native), **when** they open or post any function it guards, **then** access is denied and nothing changes; **given** a user with it, the function is available. | Proposed (T-05) |
| AC-SEC-PERM-12 | **Given** a user without Customers.ActivityLogView (native), **when** they open or post any function it guards, **then** access is denied and nothing changes; **given** a user with it, the function is available. | Proposed (T-05) |
| AC-SEC-PERM-13 | **Given** a user without System.ManageSystemLog (native), **when** they open or post any function it guards, **then** access is denied and nothing changes; **given** a user with it, the function is available. | Proposed (T-05) |

## 5. Source traceability

Traceability of this module to client requirements and catalog features, and requirement coverage, are in the separate traceability document. Each acceptance criterion below names its basis.


## 6. nopCommerce 5.00 baseline and build approach

| PRD ID | Native capability in 5.00.1 | Gap / to build | Code change | Evidence | Confidence |
|---|---|---|---|---|---|
| PRD-SEC-001 | Passwords hashed with salt (CustomerSettings.DefaultPasswordFormat, HashedPasswordFormat); EncryptionService with SecuritySettings.EncryptionKey/UseAesEncryptionAlgorithm; card numbers are stored (Order.CardNumber encrypted, MaskedCreditCardNumber) only when the payment plugin sets ProcessPaymentResult.AllowStoringCreditCardNumber; PaymentSettings has no card-storage setting. [5.00.1: no change found; 4.90 evidence paths exist in 5.00.1: src/Libraries/Nop.Core/Domain/Customers/CustomerSettings.HashedPasswordFormat; src/Libraries/Nop.Core/Domain/Security/SecuritySettings.cs; src/Libraries/Nop.Services/Security/EncryptionService.cs; src/Libraries/Nop.Core/Domain/Orders/Order.CardNumber] | TLS termination and storage/database encryption at rest are hosting configuration (no code). Keep card storage disabled. | None | Paths are given in the native-capability column (source tag release-5.00.1) | Verified in 4.90.8 source; re-verified in 5.00.1 source |
| PRD-SEC-002 | Honeypot (SecuritySettings.HoneypotEnabled), AdminAreaAllowedIpAddresses, CAPTCHA only. [5.00.1: no change found; 4.90 evidence paths exist in 5.00.1: src/Libraries/Nop.Core/Domain/Security/SecuritySettings.cs; src/Libraries/Nop.Core/Domain/Security/ProxySettings.cs] | WAF and DDoS protection at hosting/CDN level; no nopCommerce integration needed beyond proxy settings (ProxySettings/hosting config). | External system + integration plugin | Paths are given in the native-capability column (source tag release-5.00.1) | Verified in 4.90.8 source; re-verified in 5.00.1 source |
| PRD-SEC-003 | Payment plugin model supports PaymentMethodType.Redirection (hosted payment page) so the shop receives only status/token; card storage is controlled only by the payment plugin through ProcessPaymentResult.AllowStoringCreditCardNumber (stored on Order.AllowStoringCreditCardNumber); PaymentSettings has no such setting [5.00.1: no change found; 4.90 evidence paths exist in 5.00.1: src/Libraries/Nop.Services/Payments/PaymentMethodType.cs (Redirection = 15); src/Libraries/Nop.Core/Domain/Orders/Order.AllowStoringCreditCardNumber] | Requires the hosted gateway plugin for each client bank (PAY-002). | None | Paths are given in the native-capability column (source tag release-5.00.1) | Verified in 4.90.8 source; re-verified in 5.00.1 source |
| PRD-SEC-004 | ActivityLog (ActivityLogTypeId, EntityId, EntityName, CustomerId, Comment, IpAddress, CreatedOnUtc); GdprLog. No old/new values, no tamper-proofing, no point-in-time replay. [5.00.1: no change found; 4.90 evidence paths exist in 5.00.1: src/Libraries/Nop.Core/Domain/Logging/ActivityLog.cs; src/Libraries/Nop.Services/Logging/CustomerActivityService.cs; PG ADM-05 (NT)] | Audit store with before/after values: decorator of IRepository<> registered in a plugin INopStartup with Order > 10 (entity events alone are insufficient: publishEvent:false paths and predicate deletes publish no event); hash-chaining, search/export, replay. | Custom plugin (DI override) | Paths are given in the native-capability column (source tag release-5.00.1) | Verified in 4.90.8 source; re-verified in 5.00.1 source |
| PRD-SEC-005 | System log and activity log data only. [5.00.1: no change found; 4.90 evidence paths exist in 5.00.1: src/Libraries/Nop.Core/Domain/Logging/Log.cs; src/Libraries/Nop.Core/Domain/Logging/ActivityLog.cs] | SIEM / anomaly-correlation platform; nopCommerce needs log export (plugin) to it. | External system + integration plugin | Paths are given in the native-capability column (source tag release-5.00.1) | Not found in source — inference: correlation analytics are a SIEM function, not found in source |
| PRD-SEC-006 | Multi-store in one database; no per-store data location. [5.00.1: no change found; 4.90 evidence paths exist in 5.00.1: src/Libraries/Nop.Core/Domain/Stores/Store.cs] | Hosting region selection per client deployment (separate instance per client). | External system + integration plugin | Paths are given in the native-capability column (source tag release-5.00.1) | Not found in source — inference: data residency is a hosting decision |
| PRD-SEC-007 | GdprSettings (GdprEnabled, LogPrivacyPolicyConsent, LogNewsletterConsent, LogUserProfileChanges, DeleteInactiveCustomersAfterMonths), GdprConsent, GdprLog, admin GdprExport/GdprDelete, customer GDPR tools, StoreInformationSettings.DisplayEuCookieLawWarning. [5.00.1: no change found; 4.90 evidence paths exist in 5.00.1: src/Libraries/Nop.Core/Domain/Gdpr/GdprSettings.cs; src/Libraries/Nop.Core/Domain/Gdpr/GdprConsent.cs; src/Presentation/Nop.Web/Areas/Admin/Controllers/CustomerController.GdprExport, GdprDelete; src/Libraries/Nop.Core/Domain/StoreInformationSettings.DisplayEuCookieLawWarning; PG STF-33] | Granular cookie categories not native; country duties in SEC-012. | None | Paths are given in the native-capability column (source tag release-5.00.1) | Verified in 4.90.8 source; re-verified in 5.00.1 source |
| PRD-SEC-008 | GdprLog and customer export only. [5.00.1: no change found; 4.90 evidence paths exist in 5.00.1: src/Libraries/Nop.Core/Domain/Gdpr/GdprLog.cs] | Breach workflow: affected-subject identification, regulator/customer notification with deadlines. | Custom plugin | Paths are given in the native-capability column (source tag release-5.00.1) | Verified in 4.90.8 source; re-verified in 5.00.1 source |
| PRD-SEC-009 | None. [5.00.1: no change found; 4.90 evidence paths exist in 5.00.1: No compliance component in src] | GRC/compliance tooling for SOC 2/ISO 27001 evidence and certification; nopCommerce supplies logs/audit exports. | External system + integration plugin | Paths are given in the native-capability column (source tag release-5.00.1) | Not found in source — inference: certification evidence management is outside the application |
| PRD-SEC-010 | 4.90 permissions split View vs Create/edit/delete (32 *_VIEW permissions, e.g. 'Orders. View'), so a read-only admin role is configurable; Activity log view permission. No time-limited access or audit-query UI. [5.00.1: no change found; 4.90 evidence paths exist in 5.00.1: src/Libraries/Nop.Services/Security/StandardPermission.cs (*_VIEW); src/Libraries/Nop.Services/Security/DefaultPermissionConfigManager.cs; 4.70.5 had single Manage* permissions (StandardPermissionProvider.ManageOrders); PG PG-20] | Time-boxed auditor role assignment and query UI over SEC-004 audit store. | Custom plugin | Paths are given in the native-capability column (source tag release-5.00.1) | Verified in 4.90.8 source; re-verified in 5.00.1 source |
| PRD-SEC-011 | None. [5.00.1: no change found; 4.90 evidence paths exist in 5.00.1: No scanning component in src] | SCA/DAST/container scanning in CI/CD and runtime, pen-test tracking with remediation deadlines (DevSecOps tools). | External system + integration plugin | Paths are given in the native-capability column (source tag release-5.00.1) | Not found in source — inference: vulnerability management is a delivery/operations toolchain |
| PRD-SEC-012 | GDPR tooling only (consent, export, delete, retention by inactivity). [5.00.1: no change found; 4.90 evidence paths exist in 5.00.1: src/Libraries/Nop.Core/Domain/Gdpr/GdprSettings.cs] | Kenya DPA 2019 / Malawi DPA 2024 pack: processing register, cross-border transfer records, DPIA, breach deadlines, DSAR timers. | Custom plugin | Paths are given in the native-capability column (source tag release-5.00.1) | Verified in 4.90.8 source; re-verified in 5.00.1 source |
| PRD-SEC-013 | CaptchaSettings unchanged except: new ShowOnWithdrawalForm (Libraries/Nop.Core/Domain/Security/CaptchaSettings.cs:83); ShowOnForum and ShowOnNewsCommentPage removed from core (forums/news now plugins). reCAPTCHA v2/v3 and other ShowOn* flags present. | None. | None | Paths are given in the native-capability column (source tag release-5.00.1) | Verified in 4.90.8 source; re-verified in 5.00.1 source |
| PRD-SEC-014 | Card number masking only (Order.MaskedCreditCardNumber). [5.00.1: no change found; 4.90 evidence paths exist in 5.00.1: src/Libraries/Nop.Core/Domain/Orders/Order.MaskedCreditCardNumber] | Field sensitivity classification and masking in admin views, exports and logs. | Custom plugin + Theme/view override | Paths are given in the native-capability column (source tag release-5.00.1) | Verified in 4.90.8 source; re-verified in 5.00.1 source |
| PRD-SEC-015 | None. [5.00.1: no change found; 4.90 evidence paths exist in 5.00.1: No incident component in src] | Security incident management/ITSM tool (records, playbooks, timeline, lessons learned); nopCommerce supplies log exports. | External system + integration plugin | Paths are given in the native-capability column (source tag release-5.00.1) | Not found in source — inference: incident handling covers infrastructure as well as the application |


## 7. Feature specifications


### 7.1 PRD-SEC-001 Encryption and transport security

| Item | Value |
|---|---|
| Description (baseline) | All traffic is encrypted, stored data is encrypted, passwords are stored in a form that cannot be read back, and card numbers are never stored. |
| Why it matters | Protects customer data if anything is intercepted or stolen. |
| Who benefits | All users |
| Phase | P1 |
| Implementation | Configuration — None |
| Depends on | PRD-PLT-007 |
| Status | Ready; conditions: CFG-01 |

**User stories**

| ID | Story | Basis | Readiness |
|---|---|---|---|
| US-SEC-001-01 | As a shopper, I want all traffic between my device and the shop to be encrypted, so that no one can read or change what I send. | D; REQ-KTDA-SEC-002; REQ-MPC-SEC-001 | Ready; conditions: CFG-01 |
| US-SEC-001-02 | As a client administrator, I want stored data, files and backups to be encrypted, so that data stays protected if storage is stolen. | D; REQ-MPC-FR-148; FC-M21-001 | Ready; conditions: CFG-01 |
| US-SEC-001-03 | As a registered customer or staff user, I want my password stored in a form that cannot be read back, so that my password cannot be leaked from the database. | D | Ready; conditions: CFG-01 |
| US-SEC-001-04 | As a member of finance staff, I want card numbers never to be stored, so that we stay out of card-data storage. | D; REQ-MPC-FR-148 | Ready; conditions: CFG-01 |

**Acceptance criteria**

| ID | Story | Criterion | Basis |
|---|---|---|---|
| AC-SEC-001-01-01 | US-SEC-001-01 | **Given** the instance is live with a TLS certificate (PLT-007), **when** a request arrives over plain HTTP, **then** it is redirected to HTTPS; Store.SslEnabled is true for every store, because the native HttpsRequirement filter redirects HTTPS to HTTP when it is false. | REQ-KTDA-SEC-002; REQ-MPC-SEC-001; FIT (HttpsRequirementAttribute) |
| AC-SEC-001-01-02 | US-SEC-001-01 | **Given** TLS is terminated at a proxy or load balancer, **when** the application receives requests, **then** HostingConfig.UseProxy and ForwardedProtoHeaderName are set so the application sees the original HTTPS scheme and issues the auth cookie with the Secure flag (native CookieSecurePolicy.SameAsRequest). | REQ-MPC-SEC-001; FIT (HostingConfig; ServiceCollectionExtensions.AddCookie) |
| AC-SEC-001-01-03 | US-SEC-001-01 | **Given** the go-live hosting checklist (PLT-001) is run, **when** TLS protocol versions and cipher suites are tested, **then** only the versions and suites in the checklist are accepted; the minimum version is Not stated in source (catalog target TLS 1.2 or higher, FC-M21-002, Proposed). | REQ-KTDA-SEC-002; FC-M21-002 |
| AC-SEC-001-01-04 | US-SEC-001-01 | **Given** a product adapter calls an external system (payment, SMS, carrier, registry), **when** the call is made, **then** it uses HTTPS; an adapter configured with a plain-HTTP endpoint is refused at save time. | REQ-MPC-SEC-001 |
| AC-SEC-001-02-01 | US-SEC-001-02 | **Given** the go-live hosting checklist is run, **when** the database, file storage and backups are inspected, **then** encryption at rest is enabled for each (hosting function, for example transparent data encryption) and recorded with evidence. | REQ-MPC-FR-148; FC-M21-001 |
| AC-SEC-001-02-02 | US-SEC-001-02 | **Given** the instance is installed, **when** SecuritySettings is checked, **then** UseAesEncryptionAlgorithm is true (install default) and EncryptionKey is unique to the instance and not taken from a configuration pack (BR-SEC-002). | FIT (SecuritySettings; InstallRequiredData); CFG-01 |
| AC-SEC-001-03-01 | US-SEC-001-03 | **Given** a user sets a password, **when** the password is saved, **then** CustomerPassword holds a salted hash; CustomerSettings.DefaultPasswordFormat is Hashed and HashedPasswordFormat is SHA512 (install defaults). | FIT (CustomerRegistrationService; NopCustomerServiceDefaults) |
| AC-SEC-001-03-02 | US-SEC-001-03 | **Given** a configuration pack sets DefaultPasswordFormat to Clear or Encrypted, **when** the pack is applied, **then** it is rejected and nothing is changed (BR-SEC-001). | Proposed |
| AC-SEC-001-04-01 | US-SEC-001-04 | **Given** payment plugins are installed, **when** the platform team checks them before go-live, **then** Withdrawn (VER-500): now native — nopCommerce 5.00 removed card storage: ProcessPaymentResult has no AllowStoringCreditCardNumber (Libraries/Nop.Services/Payments/ProcessPaymentResult.cs), the Order card fields are obsolete and no longer written (Libraries/Nop.Core/Domain/Orders/Order.cs:322-358), the admin EditCreditCardInfo action and the bundled Payments.Manual plugin are removed; verified by AC-SEC-001-04-02. | VER-500; REQ-MPC-FR-148; FIT (5.00.1) |
| AC-SEC-001-04-02 | US-SEC-001-04 | **Given** a client instance runs nopCommerce 5.00.1 with the product payment plugins, **when** an order is placed and paid with any active payment method, and the order is opened in admin, **then** no card number, masked card number, card holder, expiry or security code is stored on the order or shown in admin, and no admin action to edit card data exists (BR-SEC-003). | VER-500; REQ-MPC-FR-148; FIT (5.00.1: Libraries/Nop.Core/Domain/Orders/Order.cs:322-358 [Obsolete]; no card fields in Libraries/Nop.Services/Payments/ProcessPaymentResult.cs; Presentation/Nop.Web/Areas/Admin/Controllers/OrderController.cs has no EditCreditCardInfo) |

**Business rules applied:** BR-SEC-001; BR-SEC-002; BR-SEC-003 (§8.1).


### 7.2 PRD-SEC-002 Edge protection

| Item | Value |
|---|---|
| Description (baseline) | Protection at the hosting level against attacks, such as a web application firewall and protection from floods of fake traffic (DDoS). |
| Why it matters | Keeps the shop online and safe from common attacks. |
| Who benefits | Clients; shoppers |
| Phase | P1 |
| Implementation | External system — External system + integration plugin |
| Depends on | — |
| Status | Ready |

**User stories**

| ID | Story | Basis | Readiness |
|---|---|---|---|
| US-SEC-002-01 | As a client administrator, I want a web application firewall and protection from floods of fake traffic in front of the shop, so that the shop stays online and common attacks are blocked. | D; REQ-KTDA-SEC-002; REQ-MPC-SEC-001 | Ready |
| US-SEC-002-02 | As a KTDA administrator, I want secure cloud hosting, so that the platform runs on hosting we trust. | REQ-KTDA-HST-001 | Ready |
| US-SEC-002-03 | As a client administrator, I want the admin area reachable only from known addresses where we want it, and form spam blocked, so that the back office is harder to attack. | FIT | Ready |
| US-SEC-002-04 | As a shopper, I want files I upload with a product or at checkout to be served only to me and to the staff who handle my order, so that my documents are not exposed to anyone who learns the link. | Proposed; FIT (DownloadController.GetFileUpload has no ownership check) | Ready |

**Acceptance criteria**

| ID | Story | Criterion | Basis |
|---|---|---|---|
| AC-SEC-002-01-01 | US-SEC-002-01 | **Given** the instance goes live, **when** public traffic is traced, **then** every public request passes the WAF and DDoS service of the hosting or CDN provider, and the application accepts traffic only from that service. | REQ-KTDA-SEC-002 (firewall, DDoS); FC-M21-009; FC-M21-010 |
| AC-SEC-002-01-02 | US-SEC-002-01 | **Given** a test sends SQL-injection and cross-site-scripting requests, **when** they reach the edge, **then** they are blocked and logged by the WAF. | REQ-MPC-SEC-001 (hacking); FC-M21-009 |
| AC-SEC-002-01-03 | US-SEC-002-01 | **Given** the WAF or proxy forwards requests, **when** the application records an IP address (IAM-012, SEC-004), **then** HostingConfig.ForwardedForHeaderName, KnownProxies and KnownNetworks are set so the real client IP address is recorded, not the proxy address. | FIT (HostingConfig) |
| AC-SEC-002-02-01 | US-SEC-002-02 | **Given** KTDA has chosen the cloud provider (AWS or Azure preferred) and region (DP-01), **when** the instance is provisioned (PLT-001), **then** the hosting checklist records provider, region, WAF / DDoS service and encryption at rest as evidence. | REQ-KTDA-HST-001 |
| AC-SEC-002-03-01 | US-SEC-002-03 | **Given** SecuritySettings.AdminAreaAllowedIpAddresses lists addresses, **when** a request to the admin area comes from another address, **then** it is refused by the native ValidateIpAddress filter. | FIT |
| AC-SEC-002-03-02 | US-SEC-002-03 | **Given** SecuritySettings.HoneypotEnabled is on, **when** a bot fills the hidden honeypot field on a protected form, **then** the request is rejected and, with LogHoneypotDetection on, logged. | FIT (ValidateHoneypotAttribute) |
| AC-SEC-002-04-01 | US-SEC-002-04 | **Given** a customer uploads a file through Nop.Web ShoppingCartController.UploadFileProductAttribute, UploadFileCheckoutAttribute or ReturnRequestController.UploadFileReturnRequest [POST], **when** the upload succeeds, **then** the SEC action filter records an UploadOwnership row with the download GUID, the uploading customer and, for a product attribute, the product (BR-SEC-005). | Proposed; FIT (the actions return the download GUID; attributeId of UploadFileProductAttribute is a product attribute mapping) |
| AC-SEC-002-04-02 | US-SEC-002-04 | **Given** a download GUID of an uploaded file, **when** someone requests Nop.Web DownloadController.GetFileUpload with it, **then** no registered rule provider claims the file, and the single SEC ownership filter serves it only to the uploading customer, to a user holding Orders.OrdersView who is not a vendor user, or to a vendor user whose vendor owns the product; anyone else gets access denied with message Sec.FileAccessDenied and AUD-SEC-012 is written. | Proposed; FIT (GetFileUpload serves any upload to anyone holding the GUID) |
| AC-SEC-002-04-03 | US-SEC-002-04 | **Given** a file was uploaded before the SEC plugin was installed (no UploadOwnership row), **when** it is requested through GetFileUpload, **then** it is served only to a user holding Orders.OrdersView who is not a vendor user. | Proposed |
| AC-SEC-002-04-04 | US-SEC-002-04 | **Given** a vendor user holds Security.AccessAdminPanel (native default for Vendors), **when** the vendor user requests Admin DownloadController.DownloadFile with a GUID, **then** the single SEC ownership filter serves it only if the file is recorded in UploadOwnership for a product of that vendor or is the download or sample download of a product of that vendor, and no claiming rule provider denies it; otherwise access is denied with message Sec.FileAccessDenied and AUD-SEC-012 is written. | Proposed; FIT (DownloadFile serves any download by GUID to any admin-area user) |
| AC-SEC-002-04-05 | US-SEC-002-04 | **Given** a module has registered a download-access rule provider (IC-SEC-05; for example EGV-002 for files of e-Government applications) and the provider claims the requested file, **when** the file is requested through GetFileUpload or Admin DownloadFile, **then** the SEC filter applies the provider decision instead of the base rule: the file is served only when every claiming provider returns Allow; a Deny gives access denied with message Sec.FileAccessDenied and AUD-SEC-012; the provider adds no filter of its own on these actions (BR-SEC-005). | Proposed (owner decision: one download-ownership filter, SEC-002) |
| AC-SEC-002-04-06 | US-SEC-002-04 | **Given** an upload has a file type outside the allowed list, **when** it is posted, **then** it is refused by the ADM-008 upload policy (BR-ADM-060), which owns server-side type checks for all upload actions; SEC adds no type check of its own. | FIT (native upload actions check size only; allowed extensions are checked only in the browser) |

**Business rules applied:** BR-SEC-004; BR-SEC-005 (§8.1).


### 7.3 PRD-SEC-003 PCI-DSS scope control

| Item | Value |
|---|---|
| Description (baseline) | Card payments happen on the bank's secure page, and only a token comes back to the shop, so the shop never handles card numbers. |
| Why it matters | Keeps the shop outside the most demanding card-security audits. |
| Who benefits | Clients; finance staff |
| Phase | P1 |
| Implementation | Configuration — None |
| Depends on | — |
| Status | Ready |

**User stories**

| ID | Story | Basis | Readiness |
|---|---|---|---|
| US-SEC-003-01 | As a member of finance staff, I want card payments to happen on the bank page so that only a token comes back to the shop, so that the shop stays outside the most demanding card-security audits. | D; REQ-KTDA-SEC-001; REQ-MPC-FR-129 | Ready |
| US-SEC-003-02 | As a client administrator, I want proof that the shop holds no card data, so that our PCI-DSS assessment stays small. | REQ-MPC-FR-148 | Ready |

**Acceptance criteria**

| ID | Story | Criterion | Basis |
|---|---|---|---|
| AC-SEC-003-01-01 | US-SEC-003-01 | **Given** a card payment adapter is configured (PAY-002), **when** its PaymentMethodType is read, **then** it is Redirection (hosted payment page) or uses gateway-hosted fields; the platform never receives the card number or security code (see PAY-002 (REQ-MPC-FR-129); BR-PAY-011). | REQ-KTDA-SEC-001; FIT (PaymentMethodType.Redirection) |
| AC-SEC-003-01-02 | US-SEC-003-01 | **Given** the gateway offers tokenisation, **when** a card payment completes, **then** only the gateway token and the masked last digits are stored. | REQ-MPC-FR-129 |
| AC-SEC-003-01-03 | US-SEC-003-01 | **Given** an adapter is proposed that takes card fields in the shop page and sends them to the gateway API, **when** it is reviewed, **then** it is not accepted for card payments (BR-SEC-003). | Proposed |
| AC-SEC-003-02-01 | US-SEC-003-02 | **Given** test card payments were made in the test environment, **when** the database and the logs are scanned for card-number patterns, **then** no card number is found (test note T-PAY-05). | REQ-MPC-FR-148 |

**Business rules applied:** BR-SEC-003 (§8.1).


### 7.4 PRD-SEC-004 Platform audit trail

| Item | Value |
|---|---|
| Description (baseline) | A tamper-proof record of every important action in the system: who did what and when, with old and new values, searchable and exportable, and able to replay the history to show exactly how a record looked — and what each person could see — at any past moment. |
| Why it matters | Full accountability and evidence for audits and investigations. |
| Who benefits | Auditors; management |
| Phase | P1 |
| Implementation | Code-level — Custom plugin (DI override) |
| Depends on | — |
| Status | Ready; conditions: OVR-REG, CFG-01 |

**User stories**

| ID | Story | Basis | Readiness |
|---|---|---|---|
| US-SEC-004-01 | As an auditor, I want every important action recorded: who, what, when, from where, with old and new values, so that I can account for every change. | D; FC-M20-001; REQ-MPC-FR-287 | Ready; conditions: OVR-REG, CFG-01 |
| US-SEC-004-02 | As an auditor, I want audit records that cannot be changed or deleted, and any tampering detected, so that the trail is evidence. | D; FC-M20-002; FC-M20-003; FC-M03-028 | Ready; conditions: OVR-REG, CFG-01 |
| US-SEC-004-03 | As an auditor, I want to search the audit trail and export results in several formats with proof of integrity, so that I can use it in audits and legal cases. | D; REQ-MPC-AUD-001; FC-M20-006; FC-M20-007 | Ready; conditions: OVR-REG, CFG-01 |
| US-SEC-004-04 | As an auditor, I want to see how a record looked, and what each person could access, at any past moment, so that I can reconstruct a case. | D; FC-M20-008 | Ready; conditions: OVR-REG, CFG-01 |
| US-SEC-004-05 | As a member of compliance staff, I want reports of logins, admin actions and configuration changes, so that I can monitor security and compliance. | REQ-MPC-FR-287 | Ready; conditions: OVR-REG, CFG-01 |
| US-SEC-004-06 | Technical enabler. As a module developer, I want one service to record the business events of my module, so that all modules share one trail. | D; Proposed | Ready; conditions: OVR-REG, CFG-01 |
| US-SEC-004-07 | As a member of fraud staff, I want changes to fraud rules recorded with old and new values, so that rule changes are controlled. | REQ-MPC-FR-320 | Ready; conditions: OVR-REG, CFG-01 |
| US-SEC-004-08 | As an approver, I want high-risk actions recorded together with their approval, so that approvals are evidenced. | REQ-MPC-FR-039 | Ready; conditions: OVR-REG, CFG-01 |

**Acceptance criteria**

| ID | Story | Criterion | Basis |
|---|---|---|---|
| AC-SEC-004-01-01 | US-SEC-004-01 | **Given** the SEC plugin registers a decorator of IRepository<> in its INopStartup (Order greater than 10, after NopDbStartup registers EntityRepository<> at Order 10), **when** an audited entity is inserted, updated or deleted through any repository method, including calls with publishEvent false, **then** an AuditEvent is written with actor (current customer and, when impersonating, the original customer), IP address, UTC time, store, entity name, entity id, old values (LoadOriginalCopyAsync) and new values (BR-SEC-010). | D; FIT (5.00.1: IRepository, Libraries/Nop.Data/IRepository.cs:115-175 — async members only, the synchronous Insert, Update, Delete, GetById and GetAll were removed in 5.00; NopDbStartup Order 10, Libraries/Nop.Data/NopDbStartup.cs:88) |
| AC-SEC-004-01-02 | US-SEC-004-01 | **Given** a repository DeleteAsync with a predicate is called, **when** it runs, **then** the matching rows are read first and one delete event with old values is written per row. | FIT (IRepository.DeleteAsync(predicate) publishes no entity event) |
| AC-SEC-004-01-03 | US-SEC-004-01 | **Given** AclService.SaveAclAsync or StoreMappingService.SaveStoreMappingsAsync changes the SubjectToAcl or LimitedToStores flag directly through INopDataProvider, **when** the change is saved, **then** the SEC overrides of these virtual methods write the change event (BR-SEC-011). | FIT (AclService.SaveAclAsync; StoreMappingService.SaveStoreMappingsAsync) |
| AC-SEC-004-01-04 | US-SEC-004-01 | **Given** a changed field is on the redaction list (password hashes and salts, secret settings, code hashes), **when** the event is written, **then** the field name is recorded and the value is written as "[redacted]" (BR-SEC-012). | Proposed |
| AC-SEC-004-01-05 | US-SEC-004-01 | **Given** an update changes only fields on the ignore list (for example Customer.LastActivityDateUtc), **when** it is saved, **then** no audit event is written. | Proposed |
| AC-SEC-004-01-06 | US-SEC-004-01 | **Given** writing the audit event fails, **when** the repository call runs, **then** the entity change and the audit insert run in one transaction, so the change is rolled back and an error is logged (BR-SEC-015). | Proposed |
| AC-SEC-004-02-01 | US-SEC-004-02 | **Given** events are appended, **when** the chain writer runs under ILocker key 'sec-audit-chain', **then** each event gets the next sequence number and a hash over its canonical content and the previous hash (BR-SEC-013). | D; FC-M20-002; FC-M20-003; FC-M03-025 |
| AC-SEC-004-02-02 | US-SEC-004-02 | **Given** any user, including an administrator, looks for a way to change or delete an audit event, **when** the screens and services are inspected, **then** none exists; the database login of the application has insert and select rights only on the audit tables (hosting checklist). | D; FC-M20-002 |
| AC-SEC-004-02-03 | US-SEC-004-02 | **Given** an event was altered, removed or reordered in the database, **when** integrity verification runs (scheduled or on demand), **then** the result is Broken at the first bad sequence number, the security officer is alerted with message Sec.ChainBroken and AUD-SEC-003 is written. | FC-M20-003; FC-M03-028 |
| AC-SEC-004-03-01 | US-SEC-004-03 | **Given** a user holds Security.Core.AuditTrail.View, **when** the user searches by actor, entity type, entity id, event id (AUD-...), store, date range and amount where the entity has one, **then** matching events are listed with old and new values, without SQL. | FC-M20-006 |
| AC-SEC-004-03-02 | US-SEC-004-03 | **Given** a user holds Security.Core.AuditTrail.Export, **when** the user exports a search result, **then** files are produced in CSV, JSON and XLSX (formats Proposed) with a manifest holding the filter, event count, first and last sequence numbers, the chain hashes at both ends and a signature of the manifest; message Sec.AuditExportReady is shown and AUD-SEC-002 is written. | REQ-MPC-AUD-001; FC-M20-007; FC-M03-027 |
| AC-SEC-004-04-01 | US-SEC-004-04 | **Given** an entity id and a past time T, **when** the auditor runs replay, **then** the field values of the entity at T are rebuilt from its events and shown with the event that set each value. | D; FC-M20-008; FC-M03-026 |
| AC-SEC-004-04-02 | US-SEC-004-04 | **Given** a user and a past time T, **when** the auditor runs access replay, **then** the roles, permission mappings, ACL, store mappings, scopes and delegations in force for that user at T are rebuilt from their audited changes. | D; FC-M20-008 |
| AC-SEC-004-05-01 | US-SEC-004-05 | **Given** a period is chosen, **when** the compliance report runs, **then** it lists logins and failed logins (AuthEvent copies, IAM-012), changes made in the admin area by user, setting changes (Setting entity events, PLT-004) and staff read access to customer records (AUD-IAM-010, IAM-010), and can be exported. | REQ-MPC-FR-287 |
| AC-SEC-004-05-02 | US-SEC-004-05 | **Given** IAM writes AUD-IAM-010 for each staff view of a customer record, an order or a customer address in admin (BR-IAM-080), **when** a reader such as the RPT-006 access report calls IC-SEC-01 QueryAsync with event id AUD-IAM-010 and a period, **then** the view events are returned with staff user, customer, page and time in sequence order; views of other record types are not captured. | Proposed |
| AC-SEC-004-05-03 | US-SEC-004-05 | **Given** a Setting row is inserted, updated or deleted through ISettingService (including PLT-004 applying a change set), **when** the repository call runs, **then** the event records actor, time, key (Setting.Name), StoreId, old value and new value; for a key flagged secret (BR-PLT-013 list or a plugin key catalogue) both values are written as "[redacted]" (BR-SEC-012). | REQ-MPC-FR-287; FIT (SettingService writes through IRepository<Setting>) |
| AC-SEC-004-06-01 | US-SEC-004-06 | **Given** a module calls IAuditTrail.WriteAsync (IC-SEC-01) with an event id such as AUD-PAY-003, **when** the call returns, **then** the event is in the same chain, linked to the entity changes of the same request by a correlation id. | D; Proposed |
| AC-SEC-004-06-02 | US-SEC-004-06 | **Given** a reader such as RPT-003 calls IC-SEC-01 QueryAsync with "sequence greater than" a watermark, an entity name and a page size, **when** the call returns, **then** events are returned in sequence order without gaps, one page at a time, with the last sequence number of the page, so a repeated call from that number returns the next page. | D; Proposed |
| AC-SEC-004-07-01 | US-SEC-004-07 | **Given** a fraud rule is enabled, disabled or changed (AUD-PAY-003), **when** the change is saved, **then** the audit trail holds the old and new values, the actor and the time, and the event is found by searching for the rule. | REQ-MPC-FR-320 |
| AC-SEC-004-08-01 | US-SEC-004-08 | **Given** a high-risk action is requested and approved (for example a payout account change, SEL-005, through ADM-006), **when** the approval completes, **then** the request, the approval decision, the approver and the resulting change are linked by one correlation id in the audit trail. | REQ-MPC-FR-039 |

**Business rules applied:** BR-SEC-010; BR-SEC-011; BR-SEC-012; BR-SEC-013; BR-SEC-014; BR-SEC-015; BR-SEC-016; BR-SEC-070 (§8.1).


### 7.5 PRD-SEC-005 Anomaly and correlation detection

| Item | Value |
|---|---|
| Description (baseline) | Spots unusual patterns and links suspicious activity across different parts of the system. |
| Why it matters | Detects fraud that single checks would miss. |
| Who benefits | Fraud and security staff |
| Phase | P2 |
| Implementation | External system — External system + integration plugin |
| Depends on | — |
| Status | Ready |

**User stories**

| ID | Story | Basis | Readiness |
|---|---|---|---|
| US-SEC-005-01 | As a security officer, I want audit, authentication and risk events sent to our security-monitoring system, so that suspicious patterns across modules are detected there. | D; FC-M20-010 | Ready |
| US-SEC-005-02 | As a security officer, I want unusual patterns such as bursts of failed logins or unusual approval times detected, so that fraud and misuse are found early. | D; FC-M20-009 | Ready |

**Acceptance criteria**

| ID | Story | Criterion | Basis |
|---|---|---|---|
| AC-SEC-005-01-01 | US-SEC-005-01 | **Given** the security-monitoring export is configured (Security.Core.SecurityExport.CreateEditDelete), **when** audit events, authentication events (IAM-012), risk flags (PAY-018) and system-log errors are written, **then** they are sent through IC-SEC-02 in batches by a scheduled task, in sequence order, without gaps. | D; FC-M20-010 |
| AC-SEC-005-01-02 | US-SEC-005-01 | **Given** the monitoring system is unreachable, **when** an export batch fails, **then** the batch stays Queued and is retried; when the backlog exceeds the configured age the security officer is alerted (AUD-SEC-011). | Proposed |
| AC-SEC-005-02-01 | US-SEC-005-02 | **Given** correlation and anomaly rules are configured in the monitoring system, **when** events arrive, **then** detection and alerting happen in the monitoring system (external); the product supplies complete events only. | D; FIT (no correlation engine in nopCommerce) |

**Business rules applied:** BR-SEC-017; BR-SEC-090 (§8.1).


### 7.6 PRD-SEC-006 Data residency

| Item | Value |
|---|---|
| Description (baseline) | Chooses the country or region where each client's data is hosted. |
| Why it matters | Meets data-location rules in data-protection law. |
| Who benefits | Clients; regulators |
| Phase | P1 |
| Implementation | External system — External system + integration plugin |
| Depends on | — |
| Status | On hold: DP-01 |

**User stories**

| ID | Story | Basis | Readiness |
|---|---|---|---|
| US-SEC-006-01 | As a client administrator, I want to choose the country or region where our data is hosted, so that we meet data-location rules. | D | On hold: DP-01 |

**Acceptance criteria**

| ID | Story | Criterion | Basis |
|---|---|---|---|
| AC-SEC-006-01-01 | US-SEC-006-01 | **Given** DP-01 is decided for the client, **when** the instance is provisioned (PLT-001), **then** the database, file storage, backups and logs are created in the decided region and the region is recorded in the instance profile and the hosting checklist. | D; DP-01 |
| AC-SEC-006-01-02 | US-SEC-006-01 | **Given** an integration sends personal data to a service hosted outside that region (for example SMS gateway, email service, security monitoring, captcha), **when** the integration is enabled, **then** a transfer record exists for it in the SEC-012 register; without it the go-live checklist fails. | D; Proposed |
| AC-SEC-006-01-03 | US-SEC-006-01 | **Given** a backup copy is made, **when** its location is checked, **then** it is in the decided region, or a transfer record covers its location. | D |

**Business rules applied:** BR-SEC-040 (§8.1).


### 7.7 PRD-SEC-007 Consent and privacy tools

| Item | Value |
|---|---|
| Description (baseline) | The built-in tools for cookie consent, recording consent, and exporting or deleting a customer's data; country-specific duties are handled by the 'Country data-protection pack'. |
| Why it matters | Basic privacy compliance from day one. |
| Who benefits | Shoppers; clients |
| Phase | P1 |
| Implementation | Configuration — None |
| Depends on | PRD-SEC-012 |
| Status | Ready; conditions: GA-EVENTS |

**User stories**

| ID | Story | Basis | Readiness |
|---|---|---|---|
| US-SEC-007-01 | As a visitor, I want to choose which cookie categories I allow, so that tracking happens only with my agreement. | D; REQ-MPC-FR-010 | Ready; conditions: GA-EVENTS |
| US-SEC-007-02 | As a client administrator, I want consent to marketing and to the privacy policy logged, so that we can prove consent. | D; REQ-MPC-FR-010 | Ready; conditions: GA-EVENTS |
| US-SEC-007-03 | As a shopper, I want the native tools to export my data and to request deletion, so that I can exercise my rights from day one. | D; REQ-MPC-FR-017 | Ready; conditions: GA-EVENTS |
| US-SEC-007-04 | As a KTDA analytics user, I want analytics tags to run only with consent, so that analytics data is collected lawfully. | REQ-KTDA-ANL-008 | Ready; conditions: GA-EVENTS |
| US-SEC-007-05 | As a client administrator, I want the native privacy settings set from the country pack, so that privacy compliance starts at go-live. | D; Inference from REQ-KTDA-LEG-001 (local data-protection law; law names inference, DP-01) | Ready; conditions: GA-EVENTS |

**Acceptance criteria**

| ID | Story | Criterion | Basis |
|---|---|---|---|
| AC-SEC-007-01-01 | US-SEC-007-01 | **Given** cookie categories are configured (necessary, and others such as analytics, personalisation and marketing; the list is Proposed) and GdprSettings.GdprEnabled is on, **when** a visitor arrives without a stored choice, **then** the consent banner (message Sec.CookieBanner) offers accept all, reject all except necessary, and choose per category; only necessary cookies are set before a choice (BR-SEC-020); the native single-button DisplayEuCookieLawWarning banner is off. | REQ-MPC-FR-010; FIT (StoreInformationSettings.DisplayEuCookieLawWarning) |
| AC-SEC-007-01-02 | US-SEC-007-01 | **Given** a visitor saves or changes a choice, **when** the choice is stored, **then** it is kept per visitor (customer record or cookie for guests), message Sec.CookieSettingsSaved is shown, it applies from the next page, and a consent record with categories, banner version and time is written (AUD-SEC-007). | REQ-MPC-FR-010 |
| AC-SEC-007-04-01 | US-SEC-007-04 | **Given** the analytics category is not accepted, **when** a page is rendered, **then** widget plugins assigned to that category (for example the bundled Widgets.GoogleAnalytics and Widgets.FacebookPixel) are not rendered, through the SEC override of IWidgetPluginManager.LoadActivePluginsAsync. | REQ-KTDA-ANL-008; REQ-MPC-FR-010; FIT (WidgetPluginManager.LoadActivePluginsAsync is virtual) |
| AC-SEC-007-01-03 | US-SEC-007-01 | **Given** the personalisation category is not accepted, or is withdrawn, **when** search and catalogue pages are rendered, **then** no search history is kept for personalisation and no data is sent to the recommendation service for that visitor (SRC-009, SRC-012 read the consent through SEC-007); on withdrawal by a registered customer IAM-017 informs SRC through IC-IAM-08. | REQ-MPC-FR-010; Proposed |
| AC-SEC-007-01-04 | US-SEC-007-01 | **Given** the AI-003 chat widget is mapped to the functional cookie category (WidgetCategoryMap; category and mapping Proposed), **when** a visitor who has not accepted the functional category opens a page, **then** the chat widget is not rendered (SEC override of IWidgetPluginManager.LoadActivePluginsAsync, BR-SEC-020); after the visitor accepts the category it is rendered from the next page. | Proposed |
| AC-SEC-007-04-02 | US-SEC-007-04 | **Given** the country profile (SEC-012) states that server-side analytics events need consent, or the value is not configured, **when** a configuration pack or an administrator sets GoogleAnalyticsSettings.EnableEcommerce to true, **then** the pack fails validation, or the SEC action filter on WidgetsGoogleAnalyticsController.Configure [POST] refuses the save with message Sec.ServerSideAnalyticsBlocked; the setting stays false, because the bundled plugin sends order placed, paid and refunded events from event consumers for every order, without a per-visitor consent check, so widget gating cannot stop them (BR-SEC-021). | REQ-KTDA-ANL-008; FIT (5.00.1: Widgets.GoogleAnalytics Plugins/Nop.Plugin.Widgets.GoogleAnalytics/EventConsumer.cs — Events.cs was replaced by EventConsumer.cs; the order handlers check only EnableEcommerce, :329, :357, :382) |
| AC-SEC-007-02-01 | US-SEC-007-02 | **Given** GdprSettings.LogPrivacyPolicyConsent and LogNewsletterConsent are on, **when** a customer accepts the privacy policy at registration or subscribes or unsubscribes from the newsletter, **then** the native GDPR log records the event. | REQ-MPC-FR-010; FIT |
| AC-SEC-007-03-01 | US-SEC-007-03 | **Given** GdprSettings.GdprEnabled is on, **when** a registered shopper opens the GDPR tools page, **then** export of personal data (native XLSX) and the deletion request are offered; the flows are IAM-017. | REQ-MPC-FR-017; FIT (CustomerController.GdprTools) |
| AC-SEC-007-05-01 | US-SEC-007-05 | **Given** a country pack is applied, **when** gdprsettings.* values are written, **then** GdprEnabled, LogPrivacyPolicyConsent, LogNewsletterConsent and LogUserProfileChanges are on; the native task "Delete inactive customers (GDPR)" stays disabled unless the retention rule of the country profile says so, and the install value DeleteInactiveCustomersAfterMonths = 36 is not adopted as a product default. | Inference from REQ-KTDA-LEG-001 (law names inference, DP-01); FIT (InstallRequiredData; DeleteInactiveCustomersTask) |
| AC-SEC-007-04-03 | US-SEC-007-04 | **Given** Widgets.GoogleAnalytics is active, mapped to the analytics category, and the country profile requires consent for it or is not configured, **when** a visitor who has not accepted analytics adds an item to the cart or wishlist or removes one, **then** no add-to-cart, remove-from-cart or wishlist event is sent to Google, because the SEC-007 override answers IsPluginActiveAsync(Widgets.GoogleAnalytics) with false for that visitor; after the visitor accepts analytics the events are sent from the next request (BR-SEC-021). | VER-500; REQ-KTDA-ANL-008; FIT (5.00.1: Plugins/Nop.Plugin.Widgets.GoogleAnalytics/EventConsumer.cs:101-104, 393-437); Proposed |

**Business rules applied:** BR-SEC-020; BR-SEC-021 (§8.1).


### 7.8 PRD-SEC-008 Breach notification workflow

| Item | Value |
|---|---|
| Description (baseline) | If personal data is leaked, the system helps identify who was affected and notify them and the regulator within the legal deadline. |
| Why it matters | Meets legal breach-reporting duties. |
| Who benefits | Clients; regulators |
| Phase | P1 |
| Implementation | Code-level — Custom plugin |
| Depends on | PRD-SEC-012 |
| Status | Ready |

**User stories**

| ID | Story | Basis | Readiness |
|---|---|---|---|
| US-SEC-008-01 | As a privacy officer, I want to record a personal-data breach and identify who was affected, so that we know the scope quickly. | D; FC-M21-014 | Ready |
| US-SEC-008-02 | As a privacy officer, I want to notify the regulator and the affected people within the legal deadline using prepared templates, so that we meet our breach-reporting duty. | D; FC-M21-014 | Ready |

**Acceptance criteria**

| ID | Story | Criterion | Basis |
|---|---|---|---|
| AC-SEC-008-01-01 | US-SEC-008-01 | **Given** a user holds Security.Core.Breaches.CreateEditDelete, **when** the user records a breach with discovery time, description, data categories and systems, **then** a BreachCase is Open, its regulator and subject deadlines are computed from the country profile (SEC-012) and AUD-SEC-005 is written. | D |
| AC-SEC-008-01-02 | US-SEC-008-01 | **Given** a deadline value is missing in the country profile, **when** the case is created, **then** the case shows message Sec.DeadlineNotConfigured and the privacy officer is alerted; no default deadline is assumed (BR-SEC-030). | Proposed |
| AC-SEC-008-01-03 | US-SEC-008-01 | **Given** selection criteria are entered (customer list, affected entity types and record dates, stores), **when** the affected list is generated, **then** the list of affected people and their contact channels is produced and frozen with its count and criteria. | D; FC-M21-014 |
| AC-SEC-008-02-01 | US-SEC-008-02 | **Given** the case is assessed as notifiable and templates exist per regulator and per affected class, **when** the officer sends the subject notices, **then** each notice is sent through the notification engine (TRK-005, IC-TRK-04 SendEvent with the recipient list and the case as sender reference) using the breach-notice event code Sec.BreachNotice that SEC registered at installation (IC-TRK-04 RegisterEventCode, BR-SEC-100; SMS default text from the key Sec.BreachNotice) on the channel available for the person, and each send and its delivery result per person are recorded. | D; FC-M21-014 |
| AC-SEC-008-02-02 | US-SEC-008-02 | **Given** the regulator notice is submitted outside the platform, **when** the officer records the submission, **then** the date, channel and reference are stored and the case moves to RegulatorNotified (SM-SEC-02). | D |
| AC-SEC-008-02-03 | US-SEC-008-02 | **Given** a deadline is within the configured lead time and not met, **when** the deadline task runs, **then** the officer is alerted; when the deadline passes the case is marked Overdue. | D |
| AC-SEC-008-02-04 | US-SEC-008-02 | **Given** the case is assessed as not notifiable, **when** the officer records the decision with a reason, **then** a second user holding Security.Core.Breaches.CreateEditDelete must confirm it before the case can close. | Proposed |

**Business rules applied:** BR-SEC-030; BR-SEC-100 (§8.1).


### 7.9 PRD-SEC-009 Compliance reports and certificates

| Item | Value |
|---|---|
| Description (baseline) | Reports and evidence packs showing compliance with security and privacy frameworks (for example SOC 2 and ISO 27001 controls), for auditors and certification bodies, and signed audit certificates attesting the integrity of the platform's records after an audit; the certification itself is obtained by the operating organisation. |
| Why it matters | Gives auditors and certification bodies the evidence they need from the system. |
| Who benefits | Compliance staff |
| Phase | P2 |
| Implementation | External system — External system + integration plugin |
| Depends on | — |
| Status | Ready |

**User stories**

| ID | Story | Basis | Readiness |
|---|---|---|---|
| US-SEC-009-01 | As a member of compliance staff, I want evidence exports for security and privacy controls (for example SOC 2 and ISO 27001), so that auditors and certification bodies get evidence from the system. | D; FC-M20-011; FC-M21-005; FC-M21-006 | Ready |
| US-SEC-009-02 | As an auditor, I want a signed statement of the integrity of the platform records after an audit, so that the result of the audit is attested. | D; FC-M20-012 | Ready |

**Acceptance criteria**

| ID | Story | Criterion | Basis |
|---|---|---|---|
| AC-SEC-009-01-01 | US-SEC-009-01 | **Given** a user holds Security.Core.AuditTrail.Export, **when** the user runs the evidence export for a period, **then** it produces: access audit report (IAM-011), MFA status, privileged accounts, audit-chain verification results, configuration change log, auditor-access grants and dependency-scan results recorded for each release (SEC-011), each with its manifest. | D; FC-M20-011 |
| AC-SEC-009-01-02 | US-SEC-009-01 | **Given** the evidence files are produced, **when** they are loaded into the compliance (GRC) tool, **then** the tool can read them (CSV and JSON); control mapping and certification are done in the tool and by the organisation (external, ORG-SVC). | D; FIT (no compliance component in nopCommerce) |
| AC-SEC-009-02-01 | US-SEC-009-02 | **Given** an audit is completed by the auditor, **when** the auditor requests the integrity statement for the audited period, **then** the platform produces the verification result for the period (first and last sequence numbers, chain hashes, Verified) signed with the instance signing key, for the auditor to countersign. | D; FC-M20-012 |

**Business rules applied:** BR-SEC-013; BR-SEC-090 (§8.1).


### 7.10 PRD-SEC-010 Auditor read-only access

| Item | Value |
|---|---|
| Description (baseline) | Gives auditors temporary read-only access and a way to query the audit records. |
| Why it matters | Audits happen without risk of changes. |
| Who benefits | Auditors |
| Phase | P2 |
| Implementation | Code-level — Custom plugin |
| Depends on | — |
| Status | Ready |

**User stories**

| ID | Story | Basis | Readiness |
|---|---|---|---|
| US-SEC-010-01 | As a client administrator, I want to give an auditor temporary read-only access for an audit engagement, so that audits happen without risk of changes. | D; FC-M20-005 | Ready |
| US-SEC-010-02 | As an auditor, I want to query the audit records within my engagement scope, so that I can do my work without SQL. | D | Ready |

**Acceptance criteria**

| ID | Story | Criterion | Basis |
|---|---|---|---|
| AC-SEC-010-01-01 | US-SEC-010-01 | **Given** a user holds Security.Core.AuditorAccess.CreateEditDelete, **when** the user grants access to an auditor account with start, end, stores and period of records, **then** the account is in the Auditor role, which holds Security.AccessAdminPanel, native *View permissions and Security.Core.AuditTrail.View only; between start and end the grant is Active (SM-SEC-03). | D; FIT (native view / create-edit-delete split, unchanged in 5.00.1: Libraries/Nop.Services/Security/StandardPermission.cs) |
| AC-SEC-010-01-02 | US-SEC-010-01 | **Given** an auditor tries any create, edit or delete action in admin, **when** the request is posted, **then** it is denied by the native permission check and nothing changes. | D; FIT |
| AC-SEC-010-01-03 | US-SEC-010-01 | **Given** the end of the grant passes, **when** the auditor makes a request, **then** access is denied at once through the IAM IPermissionService override (BR-IAM-060), message Sec.AuditorAccessExpired is shown and the grant becomes Expired (AUD-SEC-004). | D; Proposed |
| AC-SEC-010-02-01 | US-SEC-010-02 | **Given** the grant limits the period and stores, **when** the auditor searches the audit trail, **then** only events in that period and those stores are returned. | FC-M20-005 |
| AC-SEC-010-02-02 | US-SEC-010-02 | **Given** the auditor views or exports records, **when** the action completes, **then** it is recorded in the audit trail with the auditor as actor. | D |

**Business rules applied:** BR-SEC-050; BR-SEC-090 (§8.1).


### 7.11 PRD-SEC-011 Vulnerability management

| Item | Value |
|---|---|
| Description (baseline) | Automatically scans the software and its components for known security weaknesses before each release and continuously on the running servers, tracks results of regular independent penetration tests, and sets deadlines to fix what is found. |
| Why it matters | Fewer security holes reach the live system. |
| Who benefits | Platform team |
| Phase | P1 |
| Implementation | External system — External system + integration plugin |
| Depends on | — |
| Status | Ready |

**User stories**

| ID | Story | Basis | Readiness |
|---|---|---|---|
| US-SEC-011-01 | Technical enabler. As a member of the platform team, I want the code and its components scanned for known weaknesses before each release, so that fewer security holes reach the live system. | D; FC-M21-011 | Ready |
| US-SEC-011-02 | Technical enabler. As a member of the platform team, I want the running servers scanned continuously, so that new weaknesses are found quickly. | D; FC-M21-011 | Ready |
| US-SEC-011-03 | As a client administrator, I want findings of independent penetration tests tracked to closure with deadlines, so that weaknesses are fixed on time. | D; FC-M21-012 | Ready |

**Acceptance criteria**

| ID | Story | Criterion | Basis |
|---|---|---|---|
| AC-SEC-011-01-01 | US-SEC-011-01 | **Given** an Increment is built, **when** the dependency (software composition) scan runs in the pipeline, **then** a new high or critical vulnerability fails the build and the Increment does not meet Definition of Done criterion 5 (NFR-X-001). | D; FC-M21-011 |
| AC-SEC-011-02-01 | US-SEC-011-02 | **Given** the runtime scanner of the hosting environment reports a finding, **when** it is recorded in the tracking tool, **then** it has a severity, an owner and a fix deadline per severity (deadlines Not stated in source). | D |
| AC-SEC-011-03-01 | US-SEC-011-03 | **Given** a penetration-test report is received, **when** its findings are recorded, **then** each finding is tracked to Fixed with retest evidence or to RiskAccepted with the approver named (SM-SEC-05). | D; FC-M21-012 |
| AC-SEC-011-03-02 | US-SEC-011-03 | **Given** a penetration test is scoped for a release, **when** the scope is written, **then** it includes every entry of the extension register (BR-ADM-001) and every known platform finding of BR-SEC-081, each with its product control or "accepted risk". | D; Proposed |

**Business rules applied:** BR-SEC-080; BR-SEC-081 (§8.1).


### 7.12 PRD-SEC-012 Country data-protection pack

| Item | Value |
|---|---|
| Description (baseline) | A country-specific privacy pack for Kenya's Data Protection Act 2019 and Malawi's Data Protection Act 2024: a register of what personal data is processed, cross-border transfers, privacy impact assessments, breach deadlines and response times for data requests. |
| Why it matters | Each client meets its own country's privacy law. |
| Who benefits | Clients; regulators |
| Phase | P1 |
| Implementation | Code-level — Custom plugin |
| Depends on | — |
| Status | Ready |

**User stories**

| ID | Story | Basis | Readiness |
|---|---|---|---|
| US-SEC-012-01 | As a privacy officer, I want one data-protection profile per country with its legal parameters, so that each client meets its own country rules without code changes. | D; Inference from REQ-KTDA-LEG-001 (local data-protection law; law names inference, DP-01) | Ready |
| US-SEC-012-02 | As a privacy officer, I want a register of what personal data is processed, why, on what lawful basis and for how long, so that we can show our processing to the regulator. | D | Ready |
| US-SEC-012-03 | As a privacy officer, I want records of cross-border transfers, so that transfers are documented. | D | Ready |
| US-SEC-012-04 | As a privacy officer, I want records of privacy impact assessments, so that risky processing is assessed before it starts. | D | Ready |
| US-SEC-012-05 | As a privacy officer, I want response timers for data requests, so that requests are answered on time. | D | Ready |
| US-SEC-012-06 | As a KTDA analytics user, I want the analytics processing registered with its lawful basis, so that analytics data collection is lawful. | REQ-KTDA-ANL-008 | Ready |

**Acceptance criteria**

| ID | Story | Criterion | Basis |
|---|---|---|---|
| AC-SEC-012-01-01 | US-SEC-012-01 | **Given** the instance country is set (Kenya or Malawi), **when** the privacy officer opens the country profile, **then** it holds: law name(s) as text (inference, DP-01), regulator, data-request response time, breach deadlines to the regulator and to people, transfer conditions, consent texts per language; every value comes from configuration and unset values are shown as "not configured". | D; REQ-KTDA-LEG-001 (local data-protection regulations); DP-01 |
| AC-SEC-012-01-02 | US-SEC-012-01 | **Given** a required profile value is not configured, **when** the go-live checklist runs, **then** it lists the missing value with message Sec.ProfileIncomplete; IAM-017 and SEC-008 timers show "not configured" (BR-SEC-040). | Proposed |
| AC-SEC-012-01-03 | US-SEC-012-01 | **Given** the country profile is opened, **when** the privacy officer reads the further duties, **then** it also holds: whether personal data may be sent to external AI and translation providers and to which countries (AI-003), SMS opt-out duties and which message types are essential and sent despite opt-out (CHN-012), consent texts per partner data-sharing purpose (FIN-001 to FIN-003; the consents are recorded through IAM IC-IAM-05), and retention values per record type (read by PLT-020, including chat transcripts); every value is configuration, unset values show "not configured". | D; Proposed |
| AC-SEC-012-02-01 | US-SEC-012-02 | **Given** a user holds Security.Core.PrivacyProfile.CreateEditDelete, **when** the user records a processing activity (purpose, data categories, people concerned, lawful basis, retention rule from PLT-020, recipients, transfers, systems), **then** it is saved as a new version, listed, and exportable to CSV and XLSX (AUD-SEC-006). | D |
| AC-SEC-012-03-01 | US-SEC-012-03 | **Given** an integration or hosting location sends personal data outside the instance country, **when** the transfer record is created (destination, recipient, safeguard, data categories), **then** it is linked to the processing activities and integrations concerned (SEC-006). | D |
| AC-SEC-012-03-02 | US-SEC-012-03 | **Given** an external AI or translation provider (AI module), a recommendation service (SRC-009) or a lender (FIN) receives personal data, **when** the integration is enabled, **then** a processing activity and, when outside the instance country, a transfer record exist for it and the country profile allows it; otherwise the go-live checklist fails (BR-SEC-040). | D; Proposed |
| AC-SEC-012-04-01 | US-SEC-012-04 | **Given** a new processing activity is flagged as needing an impact assessment, **when** the assessment is recorded (risks, measures, decision, document, review date), **then** the processing activity shows the assessment status; on the review date the privacy officer is reminded. | D |
| AC-SEC-012-05-01 | US-SEC-012-05 | **Given** a privacy request is received under IAM-017, **when** its due date is set, **then** the due date is the receipt time plus the response time of the profile; requests past it are listed as Overdue. | D |
| AC-SEC-012-06-01 | US-SEC-012-06 | **Given** analytics is used, **when** the register is checked, **then** an analytics processing activity exists with lawful basis consent, and it is linked to the SEC-007 analytics cookie category. | REQ-KTDA-ANL-008 |

**Business rules applied:** BR-SEC-040 (§8.1).


### 7.13 PRD-SEC-013 Bot protection

| Item | Value |
|---|---|
| Description (baseline) | 'I am not a robot' checks (CAPTCHA) on registration, login, contact and review forms. |
| Why it matters | Stops automated spam and fake accounts. |
| Who benefits | Clients; shoppers |
| Phase | P1 |
| Implementation | Configuration — None |
| Depends on | — |
| Status | Ready |

**User stories**

| ID | Story | Basis | Readiness |
|---|---|---|---|
| US-SEC-013-01 | As a client administrator, I want "I am not a robot" checks on registration, login, contact, review and forgotten-password forms, so that automated spam and fake accounts are stopped. | D | Ready |

**Acceptance criteria**

| ID | Story | Criterion | Basis |
|---|---|---|---|
| AC-SEC-013-01-01 | US-SEC-013-01 | **Given** CaptchaSettings.Enabled is on with CaptchaType ReCaptchaV3 or CheckBoxReCaptchaV2 and the public and private keys entered for the instance, **when** a visitor submits the registration, login, contact, product review or forgotten-password form (ShowOnRegistrationPage, ShowOnLoginPage, ShowOnContactUsPage, ShowOnProductReviewPage, ShowOnForgotPasswordPage), **then** the form is accepted only with a valid captcha; otherwise the native message Common.WrongCaptchaMessage is shown. | D; FIT (CaptchaSettings; CustomerController.Login) |
| AC-SEC-013-01-02 | US-SEC-013-01 | **Given** mobile registration and code request pages exist (IAM-002), **when** a visitor requests a code, **then** the same captcha check applies before a code is sent. | Proposed |
| AC-SEC-013-01-03 | US-SEC-013-01 | **Given** the public tracking page or the guest order lookup (TRK) is configured with captcha after a number of lookups (setting, default not stated), **when** a visitor exceeds that number of lookups in the session, **then** further lookups need a valid captcha; the TRK actions use the native ValidateCaptcha filter attribute with the CaptchaSettings of SEC-013. | Proposed; FIT (ValidateCaptchaAttribute is a TypeFilterAttribute usable on plugin actions) |
| AC-SEC-013-01-04 | US-SEC-013-01 | **Given** ReCaptchaV3 is used, **when** a submission scores below CaptchaSettings.ReCaptchaV3ScoreThreshold, **then** it is refused as above; the threshold value is per client (default not stated for the product). | FIT |
| AC-SEC-013-01-05 | US-SEC-013-01 | **Given** the captcha service sends visitor data to its provider, **when** the instance goes live, **then** a transfer record for the captcha provider exists in the SEC-012 register. | Proposed |

**Business rules applied:** BR-SEC-002 (§8.1).


### 7.14 PRD-SEC-014 Data classification and masking

| Item | Value |
|---|---|
| Description (baseline) | Labels each data field by sensitivity and hides sensitive values (for example showing only the last digits of a phone number) on screens, in exports and in logs. |
| Why it matters | Staff see only the personal data they need. |
| Who benefits | Clients; shoppers |
| Phase | P2 |
| Implementation | Code-level — Custom plugin + Theme/view override |
| Depends on | PRD-SEC-006 |
| Status | On hold: DP-01 |

**User stories**

| ID | Story | Basis | Readiness |
|---|---|---|---|
| US-SEC-014-01 | As a privacy officer, I want each data field labelled by sensitivity, so that protection follows the sensitivity of the data. | D; FC-M21-004 | On hold: DP-01 |
| US-SEC-014-02 | As a member of staff, I want sensitive values hidden on screens, in exports and in logs unless my role allows them, so that I see only the personal data I need. | D | On hold: DP-01 |

**Acceptance criteria**

| ID | Story | Criterion | Basis |
|---|---|---|---|
| AC-SEC-014-01-01 | US-SEC-014-01 | **Given** a user holds Security.Core.DataClassification.CreateEditDelete, **when** the user sets the class of a field (Public, Internal, Confidential, Restricted, Personal, Financial — classes from FC-M21-004) and its masking rule, **then** the classification is saved and audited (AUD-SEC-009). | D; FC-M21-004 |
| AC-SEC-014-02-01 | US-SEC-014-02 | **Given** a field is masked for the role of the user, **when** an admin page or admin grid shows it, **then** the value is masked by the SEC global result filter (for example only the last digits of a phone number); if masking fails the value is not shown (fail closed, BR-SEC-060). | D; FIT (ModelPreparedEvent consumers would swallow errors, so a result filter is used) |
| AC-SEC-014-02-02 | US-SEC-014-02 | **Given** a user holds Security.Core.UnmaskedData.View, **when** the user chooses Reveal on a masked value, **then** the full value is shown and AUD-SEC-008 is written. | D; Proposed |
| AC-SEC-014-02-03 | US-SEC-014-02 | **Given** staff export customers or orders (native export), **when** the file is produced, **then** masked fields are masked in the file through the SEC override of IExportManager, except in the customer's own GDPR export (IAM-017). | D; FIT (IExportManager) |
| AC-SEC-014-02-04 | US-SEC-014-02 | **Given** a product plugin writes a log or audit entry containing a classified field, **when** the entry is written, **then** the value is masked or redacted according to its class. | D |
| AC-SEC-014-02-05 | US-SEC-014-02 | **Given** SEC-014 is enabled and the CRM-003 360-degree view has its own masked-field list, **when** the classification is in force, **then** CRM-003 reads the class and masking rule of each field through IC-SEC-04 and the CRM list is no longer used; reveal rights stay with the CRM permission for the 360-degree view. | D; Proposed |

**Business rules applied:** BR-SEC-060; BR-SEC-090 (§8.1).


### 7.15 PRD-SEC-015 Security incident management

| Item | Value |
|---|---|
| Description (baseline) | A place to record security incidents, follow a response checklist, keep a timeline of actions, involve the right people and record lessons learned after each incident. |
| Why it matters | Security incidents are handled quickly and consistently, with evidence for regulators and auditors. |
| Who benefits | Security team; clients; regulators |
| Phase | P2 |
| Implementation | External system — External system + integration plugin |
| Depends on | — |
| Status | Ready |

**User stories**

| ID | Story | Basis | Readiness |
|---|---|---|---|
| US-SEC-015-01 | As a security officer, I want security incidents recorded with a response checklist, a timeline, the people involved and lessons learned, so that incidents are handled consistently with evidence for regulators and auditors. | D; FC-M21-013 | Ready |

**Acceptance criteria**

| ID | Story | Criterion | Basis |
|---|---|---|---|
| AC-SEC-015-01-01 | US-SEC-015-01 | **Given** an incident is handled in the external incident tool, **when** the security officer requests evidence for a period, **then** the platform exports the audit events, authentication events and system-log entries of that period with a manifest (IC-SEC-02 or file export). | D; FIT (no incident component in nopCommerce) |
| AC-SEC-015-01-02 | US-SEC-015-01 | **Given** an incident involves personal data, **when** it is recorded, **then** a breach case is opened in SEC-008 and linked to the incident reference. | Proposed |

**Business rules applied:** BR-SEC-017; BR-SEC-090 (§8.1).


## 8. Business rules and state models

### 8.1 Business rules

| ID | Rule | Features | Basis |
|---|---|---|---|
| BR-SEC-001 | All traffic is HTTPS: Store.SslEnabled is true for every store; behind a proxy HostingConfig.UseProxy and the forwarded headers are set; adapters use HTTPS endpoints only; packs cannot set DefaultPasswordFormat to Clear or Encrypted. | SEC-001 | REQ-KTDA-SEC-002; REQ-MPC-SEC-001; FIT (HttpsRequirementAttribute; HostingConfig) |
| BR-SEC-002 | Secrets are per client instance and never in configuration packs: SecuritySettings.EncryptionKey, captcha private key, adapter credentials, export signing key. Every new SEC setting key is listed in the SEC plugin key catalogue with key, type, layer, secret flag and default (NFR-X-008); the signing key and the security-monitoring export credentials are flagged secret, so packs refuse them and exports omit them (BR-PLT-013). | SEC-001, SEC-004, SEC-013 | CFG-01; FIT (SecuritySettings; CaptchaSettings) |
| BR-SEC-003 | No card data: since nopCommerce 5.00 the platform stores no card data (ProcessPaymentResult.AllowStoringCreditCardNumber, admin EditCreditCardInfo and the bundled Payments.Manual were removed; the Order card fields are obsolete and unused); product payment plugins add no card storage of their own; card adapters use a hosted page or gateway-hosted fields. | SEC-001, SEC-003 | REQ-MPC-FR-148; REQ-KTDA-SEC-001; FIT (5.00.1: Libraries/Nop.Services/Payments/ProcessPaymentResult.cs; Libraries/Nop.Core/Domain/Orders/Order.cs:322-358); VER-500 |
| BR-SEC-004 | The application accepts public traffic only through the edge service; client IP addresses are taken from the forwarded header of known proxies only. | SEC-002 | REQ-KTDA-SEC-002; FIT (HostingConfig) |
| BR-SEC-005 | Uploaded-file access (Proposed; owner decision Download ownership): a SEC action filter on Nop.Web ShoppingCartController.UploadFileProductAttribute, UploadFileCheckoutAttribute and ReturnRequestController.UploadFileReturnRequest [POST] records UploadOwnership (download GUID, uploading customer, product). ONE SEC ownership filter covers Nop.Web DownloadController.GetFileUpload and Admin DownloadController.DownloadFile. It first calls every registered download-access rule provider (IC-SEC-05). If one or more providers claim the file, the file is served only when every claiming provider returns Allow. If no provider claims it, the base rule applies: GetFileUpload serves a file only to its uploader, to non-vendor users holding Orders.OrdersView, or to vendor users for files of their own products; DownloadFile serves vendor users only files of their own products. Every refusal shows Sec.FileAccessDenied and writes AUD-SEC-012. No other module registers a filter on these two actions. File type and size checks are ADM-008 (BR-ADM-060); SEC adds none. | SEC-002 | Proposed; FIT (DownloadController.GetFileUpload and Admin DownloadController.DownloadFile have no ownership check) |
| BR-SEC-010 | Audit capture: a decorator of IRepository<> registered by the SEC plugin INopStartup (Order greater than 10) records every insert, update and delete of audited entities through every repository method, with old values from LoadOriginalCopyAsync and new values; entity events (EntityUpdatedEvent etc.) are not used for capture, because they carry only the new entity and are not raised for publishEvent false or predicate deletes. Only the SEC plugin decorates IRepository<>. Since nopCommerce 5.00 the interface has only async members, so the decorator implements InsertAsync, UpdateAsync, DeleteAsync (entity, list and predicate) and passes the read members through. | SEC-004 | FIT (5.00.1: Libraries/Nop.Data/IRepository.cs; NopDbStartup Order 10, Libraries/Nop.Data/NopDbStartup.cs:88; L1 §6.3 PRD-SEC-004; NFR-X-003) |
| BR-SEC-011 | Writes that bypass the repository are covered by SEC overrides: AclService.SaveAclAsync and StoreMappingService.SaveStoreMappingsAsync (direct INopDataProvider.UpdateEntityAsync). Other direct data-provider writes exist only in installation code. | SEC-004 | FIT (AclService; StoreMappingService; InstallationService) |
| BR-SEC-012 | Redaction and ignore lists: values of redacted fields (CustomerPassword.Password and PasswordSalt, Setting values of keys flagged secret in BR-PLT-013 or in a plugin key catalogue, code and token hashes) are never written to the audit trail; the change itself is recorded with the field or key name; updates that change only ignored fields (for example last-activity times) are not audited. Both lists are configuration. | SEC-004, SEC-014 | Proposed |
| BR-SEC-013 | Integrity: audit events are append-only; the chain writer assigns sequence numbers and hashes (hash of canonical content plus previous hash) under ILocker key 'sec-audit-chain'; verification recomputes the chain; exports and integrity statements carry signed manifests. No product function updates or deletes an audit event; the application database login has insert and select rights only on audit tables (hosting). | SEC-004, SEC-009 | FC-M20-002; FC-M20-003; Proposed |
| BR-SEC-014 | Business events: modules write their AUD-<AREA>-nnn events through IC-SEC-01 (IAuditTrail.WriteAsync) with a correlation id per request; the native activity log is not an audit substitute, because it can be deleted (Customers.ActivityLogDelete) and holds no old values. | SEC-004, all modules | D; FIT (ActivityLog; StandardPermission.Customers.ACTIVITY_LOG_DELETE) |
| BR-SEC-015 | The entity change and its audit insert run in one database transaction; if the audit insert fails the change is rolled back and an error is logged (fail closed). | SEC-004 | Proposed |
| BR-SEC-016 | Audit events are kept for the configured retention period (default not stated); after it, whole closed segments are archived or removed with a signed checkpoint that keeps the chain verifiable. | SEC-004 | FC-M20-004 (period not reused); Proposed |
| BR-SEC-017 | Security exports (to monitoring or incident tools) are produced by scheduled tasks from the audit store in sequence order; event consumers are not used to export. | SEC-005, SEC-015 | FIT (L1 §6.2 principle 8); Proposed |
| BR-SEC-020 | Before a visitor makes a cookie choice only necessary cookies are set; widget plugins mapped to a non-accepted category are not loaded (SEC override of IWidgetPluginManager.LoadActivePluginsAsync); each choice is logged with banner version. | SEC-007 | REQ-MPC-FR-010; REQ-KTDA-ANL-008; FIT (WidgetPluginManager) |
| BR-SEC-021 | Server-side analytics events are not gated by the cookie banner: when the country profile says they need consent, or the value is not configured, GoogleAnalyticsSettings.EnableEcommerce stays false (pack validation and a SEC action filter on WidgetsGoogleAnalyticsController.Configure [POST], listed in BR-ADM-006). Since nopCommerce 5.00 the plugin also sends add-to-cart, remove-from-cart and wishlist events on every cart change without an EnableEcommerce check, gated only by IWidgetPluginManager.IsPluginActiveAsync(Widgets.GoogleAnalytics), which does not go through LoadActivePluginsAsync; the SEC-007 override of IWidgetPluginManager therefore also answers IsPluginActiveAsync for a widget mapped to a cookie category with the consent of the current visitor (false without consent) (VER-500). Other plugins that send personal data from event consumers are listed in the processing register (SEC-012) with the same consent decision. | SEC-007 | REQ-KTDA-ANL-008; FIT (5.00.1: Plugins/Nop.Plugin.Widgets.GoogleAnalytics/EventConsumer.cs:101-104, 216-262, 393-437; Libraries/Nop.Services/Cms/WidgetPluginManager.cs:42, 76-80); Proposed |
| BR-SEC-030 | Breach deadlines and notice rules come only from the country profile; no legal value is coded; a missing value is shown as not configured and alerted. | SEC-008 | D; DP-01 |
| BR-SEC-040 | One data-protection profile per country (shared with CHK-009 for the e-transactions part); law names are text; every legal value is configuration; the go-live checklist fails while a required value or a required transfer record is missing. | SEC-006, SEC-012 | D; DP-01; Proposed |
| BR-SEC-050 | Auditor access is read-only and time-boxed: Auditor role with native *View permissions and Security.Core.AuditTrail.View; start and end are checked on every request through the single IAM override of IPermissionService; searches are limited to the engagement period and stores. | SEC-010 | D; FC-M20-005; FIT (native permission split, unchanged in 5.00.1); BR-IAM-060 |
| BR-SEC-060 | Masking is applied by a SEC global result filter on admin view models and JSON results, and by the SEC override of IExportManager for staff exports; on any masking error the value is hidden (fail closed); reveals are logged. | SEC-014 | D; FIT (PublishModelEventsAttribute raises ModelPreparedEvent to consumers that swallow errors) |
| BR-SEC-070 | Extension register: every DI override and global action filter of the product is listed in the ADM extension register (BR-ADM-001), which is the single register (decision OVR-REG); SEC does not keep a copy. SEC-owned entries: the IRepository<> decorator (SEC-004), overrides of AclService.SaveAclAsync and StoreMappingService.SaveStoreMappingsAsync (SEC-004), IWidgetPluginManager.LoadActivePluginsAsync (SEC-007, owner under OVR-REG), IExportManager and the masking result filter (SEC-014), the upload-ownership recording filter and the single download-ownership filter on GetFileUpload and Admin DownloadFile with its IC-SEC-05 rule providers (BR-SEC-005). SEC checks at each release that every interface has one overriding plugin (owners per OVR-REG) and that every register entry is in the penetration-test scope (BR-SEC-081). | SEC-004, SEC-007, SEC-014 | FIT (L1 §6.2 principle 7); decision OVR-REG |
| BR-SEC-080 | No Increment with a new high or critical vulnerability in the dependency scan is released (Definition of Done criterion 5). | SEC-011 | NFR-X-001; D |
| BR-SEC-081 | Known platform findings re-checked in nopCommerce 5.00.1, each in the penetration-test scope with its product control: (1) resolved natively in 5.00 — the Misc.Brevo and Misc.Omnisend configuration actions now require Configuration.ManagePlugins (Brevo is still not installed under OVR-REG; its GetSynchronizationInfo action checks only AuthorizeAdmin and returns a synchronisation status text); (2) resolved natively in 5.00 — Admin DiscountController.ProductAddPopup [POST] refuses another vendor's discount and skips other vendors' products, so the MKT vendor discount filter is withdrawn (BR-MKT-011); (5) new in 5.00 — the HTML-editor file manager elFinder (ElFinderController.Connector, permission System.HtmlEditor.ManagePictures) writes files through its own library with its own allow-list (control: ADM-008 upload filter on Connector, BR-ADM-060); (3) Admin ArtificialIntelligenceController.GenerateMetaTags has no CheckPermission (control: AI action filter, BR-AI-004); (4) DownloadController.GetFileUpload and Admin DownloadController.DownloadFile serve files by GUID without ownership check, and upload file types are checked only in the browser (controls: the single SEC download-ownership filter with its IC-SEC-05 rule providers, BR-SEC-005; ADM-008 upload policy, BR-ADM-060). | SEC-011 | FIT (5.00.1: Plugins/Nop.Plugin.Misc.Brevo/Controllers/BrevoController.cs:227-562; Plugins/Nop.Plugin.Misc.Omnisend/Controllers/OmnisendAdminController.cs:73-137; Presentation/Nop.Web/Areas/Admin/Controllers/DiscountController.cs:487-512; ArtificialIntelligenceController.cs:53 (no CheckPermission); Presentation/Nop.Web/Controllers/DownloadController.cs:168; Admin DownloadController.cs:39; ElFinderController.cs:42-43); owner decision Download ownership; VER-500 |
| BR-SEC-100 | Messages: every SEC notification (breach notices to affected people, chain-broken, export-backlog, breach-deadline, auditor-access, impact-assessment review and profile-incomplete alerts) is sent by TRK-005 (owner decision Messages outside TRK). SEC registers its event codes at installation through IC-TRK-04 RegisterEventCode (names Proposed, listed in BR-TRK-023: Sec.BreachNotice, Sec.Core.AuditChainBroken, Sec.Core.ExportBacklog, Sec.Core.BreachDeadline, Sec.Core.AuditorAccess, Sec.Core.ImpactAssessmentReview, Sec.Core.ProfileIncomplete) and sends through IC-TRK-04 SendEvent; SEC sends nothing directly and respects TRK-006 preferences, with breach notices to people as a mandatory category where the country profile requires notice (BR-TRK-031). | SEC-004, SEC-005, SEC-008, SEC-010, SEC-012 | Proposed; owner decision Messages outside TRK |
| BR-SEC-090 | Feature state: SEC features that are not always on (SEC-005, SEC-009, SEC-010, SEC-014, SEC-015) check IC-PLT-02 IsEnabled for the store before showing pages or running scheduled work. Audit capture (SEC-004), transport and card-data rules, consent tools, the country profile, breach handling, captcha and the upload controls are always on and cannot be switched off. | SEC-005, SEC-009, SEC-010, SEC-014, SEC-015 | Proposed |


### 8.2 State models (Proposed)

Only the transitions listed are allowed; any other transition is rejected and logged.

| Model | Entity | From | Event | Guard | To | Side effect |
|---|---|---|---|---|---|---|
| SM-SEC-01 | AuditChainSegment | (none) | events appended | — | Unverified | — |
| SM-SEC-01 | AuditChainSegment | Unverified | verification passes | — | Verified | — |
| SM-SEC-01 | AuditChainSegment | Unverified / Verified | verification fails | — | Broken | security officer alerted; Sec.ChainBroken; AUD-SEC-003 |
| SM-SEC-01 | AuditChainSegment | Broken | investigation closed by security officer | reason recorded | Broken (acknowledged) | the break stays visible; no repair of events |
| SM-SEC-02 | BreachCase | (none) | breach recorded | Security.Core.Breaches.CreateEditDelete | Open | deadlines computed; AUD-SEC-005 |
| SM-SEC-02 | BreachCase | Open | assessment recorded | — | Assessed | affected list frozen |
| SM-SEC-02 | BreachCase | Assessed | regulator submission recorded | notifiable | RegulatorNotified | AUD-SEC-005 |
| SM-SEC-02 | BreachCase | RegulatorNotified | subject notices sent | notifiable to people | SubjectsNotified | sends recorded |
| SM-SEC-02 | BreachCase | Assessed | not notifiable confirmed | second user confirms | NotNotifiable | reason recorded |
| SM-SEC-02 | BreachCase | RegulatorNotified / SubjectsNotified / NotNotifiable | case closed | — | Closed | lessons recorded |
| SM-SEC-02 | BreachCase | Open / Assessed / RegulatorNotified | a deadline passes unmet | — | (same state) + Overdue flag | privacy officer alerted |
| SM-SEC-03 | AuditorAccessGrant | (none) | grant saved | Security.Core.AuditorAccess.CreateEditDelete | Scheduled | AUD-SEC-004 |
| SM-SEC-03 | AuditorAccessGrant | Scheduled | start reached | — | Active | — |
| SM-SEC-03 | AuditorAccessGrant | Active | end reached | — | Expired | access denied from next request; AUD-SEC-004 |
| SM-SEC-03 | AuditorAccessGrant | Scheduled / Active | administrator revokes | — | Revoked | AUD-SEC-004 |
| SM-SEC-04 | AuditExport | (none) | export requested | Security.Core.AuditTrail.Export | Requested | — |
| SM-SEC-04 | AuditExport | Requested | files and manifest generated | — | Generated | Sec.AuditExportReady; AUD-SEC-002 |
| SM-SEC-04 | AuditExport | Generated | downloaded / download period ends | — | Downloaded / Expired | AUD-SEC-002 |
| SM-SEC-05 | SecurityFinding (external tracking tool) | (none) | finding recorded | — | Open | owner and deadline set |
| SM-SEC-05 | SecurityFinding (external tracking tool) | Open | fix started | — | InRemediation | — |
| SM-SEC-05 | SecurityFinding (external tracking tool) | InRemediation | fix released | — | Fixed | — |
| SM-SEC-05 | SecurityFinding (external tracking tool) | Fixed | retest passes | — | Verified | — |
| SM-SEC-05 | SecurityFinding (external tracking tool) | Open / InRemediation | risk accepted | approver named | RiskAccepted | — |
| SM-SEC-06 | ProcessingActivity / ImpactAssessment | (none) | record created | Security.Core.PrivacyProfile.CreateEditDelete | Draft | — |
| SM-SEC-06 | ProcessingActivity / ImpactAssessment | Draft | privacy officer approves | — | Approved | new version; AUD-SEC-006 |
| SM-SEC-06 | ProcessingActivity / ImpactAssessment | Approved | review date reached or record changed | — | UnderReview | reminder sent |
| SM-SEC-06 | ProcessingActivity / ImpactAssessment | UnderReview | privacy officer approves | — | Approved | new version; AUD-SEC-006 |
| SM-SEC-06 | ProcessingActivity / ImpactAssessment | Approved / UnderReview | processing stopped | — | Retired | — |
| SM-SEC-07 | SecurityExportBatch | (none) | batch built | export configured | Queued | — |
| SM-SEC-07 | SecurityExportBatch | Queued | sent and acknowledged | — | Sent | cursor advanced |
| SM-SEC-07 | SecurityExportBatch | Queued | send fails | — | Queued | retry; backlog alert when too old (AUD-SEC-011) |


## 9. Data model (Proposed design — to be approved)

New entities are plugin tables (FluentMigrator migrations in the product assembly); native entities are not altered unless the L1 §6.3 register says so.

| Entity | Fields | Features | Relation to native nopCommerce |
|---|---|---|---|
| AuditEvent (new) | Sequence, EventId (AUD-... or ENTITY-INSERT / UPDATE / DELETE), OccurredOnUtc, ActorCustomerId, ImpersonatorCustomerId, IpAddress, StoreId, EntityName, EntityId, OldValues (JSON), NewValues (JSON), Reason, CorrelationId, PreviousHash, Hash | SEC-004 | Plugin table; insert and select only; native ActivityLog and GdprLog remain |
| AuditChainCheckpoint (new) | FromSequence, ToSequence, Hash, Status (SM-SEC-01), VerifiedOnUtc, Signature | SEC-004, SEC-009 | |
| AuditExport (new) | Id, RequestedBy, Filter, Formats, Status (SM-SEC-04), ManifestHash, Signature, FileDownloadIds, CreatedOnUtc | SEC-004 | Files stored as native Download records |
| AuditorAccessGrant (new) | Id, AuditorCustomerId, StartUtc, EndUtc, StoreIds, RecordsFrom, RecordsTo, Status (SM-SEC-03), GrantedBy | SEC-010 | Auditor role mapping is native CustomerCustomerRoleMapping |
| CookieCategory / WidgetCategoryMap / CookieConsent (new) | Category: SystemName, Name, IsNecessary; Map: WidgetSystemName, CategoryId; Consent: CustomerId or visitor key, Categories, BannerVersion, CreatedOnUtc | SEC-007 | Replaces the native single cookie warning (StoreInformationSettings.DisplayEuCookieLawWarning off) |
| BreachCase / BreachAffectedPerson / BreachNotice (new) | Case: DiscoveredOnUtc, Description, DataCategories, Systems, Status (SM-SEC-02), RegulatorDeadlineUtc, SubjectDeadlineUtc, RegulatorReference; Person: CustomerId, Channel; Notice: PersonId, TemplateId, SentOnUtc, DeliveryStatus | SEC-008 | Notices sent through TRK-005 |
| CountryPrivacyProfile (new) | CountryId, LawNames (text), Regulator, RequestResponseTime, BreachRegulatorDeadline, BreachSubjectRule, TransferConditions, ExternalAiTransferRule, SmsOptOutDuties, EssentialMessageTypes, ServerSideAnalyticsConsentRequired, ConsentTexts per purpose (localised), RetentionPerRecordType, E-transactions fields (CHK-009) | SEC-012, CHK-009 | Country is the native Country entity |
| UploadOwnership (new) | DownloadGuid, CustomerId, ProductId (null for checkout attributes and returns), CreatedOnUtc | SEC-002 | Native Download is not altered |
| ProcessingActivity / TransferRecord / ImpactAssessment (new) | Activity: Purpose, DataCategories, People, LawfulBasis, RetentionRuleId (PLT-020), Recipients, Systems, Version, Status (SM-SEC-06); Transfer: DestinationCountry, Recipient, Safeguard, DataCategories, IntegrationSystemName; Assessment: ActivityId, Risks, Measures, Decision, DocumentDownloadId, ReviewOn | SEC-012, SEC-006 | |
| DataClassification / MaskingRule (new) | Classification: EntityName, FieldName, Class; Rule: Class, RoleSystemNames allowed, MaskPattern | SEC-014 | |
| SecurityExportCursor / SecurityExportBatch (new) | Target, LastSequenceSent, Batch: Id, FromSequence, ToSequence, Status (SM-SEC-07), Attempts, LastError | SEC-005, SEC-015 | |
| Native entities and settings reused | SecuritySettings, CaptchaSettings, GdprSettings, StoreInformationSettings, HostingConfig (appsettings.json), Store.SslEnabled, GdprConsent, GdprLog, ActivityLog, Log, Download | SEC-001, SEC-002, SEC-007, SEC-013 | Not altered |


## 10. Configuration

### 10.1 Configuration-pack rows owned by this module (from the workbook "Config pack schema")

| Artefact | nopCommerce 5.00 source | Layers | Owning PRD | Pack |
|---|---|---|---|---|
| Country law profile (e-transactions, data protection) | Law profile (new): consent texts, timelines, DSAR SLAs, breach deadlines | country | CHK-009 / SEC-012 | Core |
| Further core setting groups | captchasettings.*, gdprsettings.*, multifactorauthenticationsettings.*, rewardpointssettings.*, localizationsettings.*, storeinformationsettings.* | global → client → store | SEC-013 / SEC-007 / IAM-004 / MKT-003 / PLT-009 / PLT-006 | Core |

### 10.2 Settings and client values

| Setting | Where it lives | Layer | KTDA (source) | Malawi Post (source) |
|---|---|---|---|---|
| HTTPS on every store | Store.SslEnabled (native) | client → store | Required (SSL, SEC-002) | Required (data in transit, SEC-001) |
| Proxy and forwarded headers | HostingConfig.UseProxy, ForwardedProtoHeaderName, ForwardedForHeaderName, KnownProxies, KnownNetworks (appsettings.json, native) | installation | Hosting (not stated) | Hosting (not stated) |
| Encryption | SecuritySettings.UseAesEncryptionAlgorithm = true, EncryptionKey per instance (native; secret) | installation | Entered at deployment | Entered at deployment |
| Password storage | CustomerSettings.DefaultPasswordFormat = Hashed, HashedPasswordFormat = SHA512 (native install defaults) | global | — | — |
| Admin IP allow-list; honeypot | SecuritySettings.AdminAreaAllowedIpAddresses, HoneypotEnabled, LogHoneypotDetection (native) | client | Not stated | Not stated |
| Audit: audited entities, ignore list, redaction list | SEC settings (new) | global → client | — | — |
| Audit retention period | SEC settings (new); PLT-020 | country → client | Not stated (KG-18) | Not stated (MG-13) |
| Audit export formats; signing key | SEC settings (new); key per instance (secret) | client | Not stated | Not stated ("different formats", AUD-001) |
| Security-monitoring export target and backlog alert age | SEC settings (new) | client | Not stated | Not stated |
| Cookie categories and widget mapping (including the AI-003 chat widget, Proposed: functional); banner text | CookieCategory, WidgetCategoryMap (new); StoreInformationSettings.DisplayEuCookieLawWarning = false (native) | country → client → store | Not stated | Cookies and tracking consent (FR-010) |
| Server-side analytics events | CountryPrivacyProfile.ServerSideAnalyticsConsentRequired (new); GoogleAnalyticsSettings.EnableEcommerce (bundled plugin) | country → client | Not stated (ANL-008 consent) | Not stated |
| GDPR settings | GdprSettings.GdprEnabled, LogPrivacyPolicyConsent, LogNewsletterConsent, LogUserProfileChanges, DeleteInactiveCustomersAfterMonths; task "Delete inactive customers (GDPR)" (native) | country → client → store | Not stated | Not stated |
| Country data-protection profile | CountryPrivacyProfile (new) | country | Kenya profile; values Not stated (DP-01) | Malawi profile; values Not stated (DP-01) |
| Breach notice templates per regulator and per affected class | MessageTemplate (native) per template system name (new) | country → client | Not stated | Not stated |
| Captcha | CaptchaSettings.Enabled, CaptchaType, ShowOnLoginPage, ShowOnRegistrationPage, ShowOnContactUsPage, ShowOnProductReviewPage, ShowOnForgotPasswordPage, ShowOnWithdrawalForm (new in 5.00; used only if guest returns are switched on, RET-001, or by the TRK-011 fallback lookup), ReCaptchaV3ScoreThreshold, ReCaptchaPublicKey / PrivateKey (native; private key secret; the forum and news flags left core with the Misc.Forums and Misc.News plugins) | global → client → store | Not stated | Not stated |
| Data classes and masking rules | DataClassification, MaskingRule (new) | vertical → client | Not stated | Not stated |
| Uploaded-file access rule | SEC settings (new); UploadOwnership | client | Not stated | Not stated |
| SEC key catalogue with secret flags | SEC plugin key catalogue (BR-SEC-002) | global | — | — |
| Hosting region | Instance profile (PLT-001) | installation | AWS or Azure preferred (HST-001); region DP-01 | Not stated (MG-14); region DP-01 |

Runtime settings resolve at two levels only (store value, else shared value); global, country, vertical, client and store layers are merged by the pack loader at apply time in that order (BR-PLT-010; L1 §6.5).


## 11. Screens, user interface and messages

### 11.1 Screens

| Area | Screen | Features | Native or new |
|---|---|---|---|
| Storefront | Cookie consent banner and cookie settings page | SEC-007 | New (replaces the native cookie warning) |
| Admin | Audit trail search, entity history, replay, access replay, integrity verification, exports | SEC-004, SEC-010 | New |
| Admin | Compliance report (logins, admin actions, configuration changes) | SEC-004 | New |
| Admin | Auditor access grants | SEC-010 | New |
| Admin | Breach cases (record, affected list, notices, deadlines) | SEC-008 | New |
| Admin | Country data-protection profile, processing register, transfers, impact assessments | SEC-012, SEC-006 | New |
| Admin | Data classification and masking rules; Reveal action on masked values | SEC-014 | New (P2) |
| Admin | Security-monitoring export configuration and queue; evidence export | SEC-005, SEC-009, SEC-015 | New (P2) |
| Admin | Security, captcha, GDPR and store-information settings | SEC-001, SEC-002, SEC-007, SEC-013 | Native |

Screen layouts are not specified here. They follow the approved designs (to be produced) and the client theme (PLT-006); until approved, developers build no layout of their own beyond the native nopCommerce admin and DefaultClean storefront patterns.


### 11.2 User-facing messages (locale resource keys)

| Key | Default English text (Proposed) | Used by |
|---|---|---|
| Sec.CookieBanner | We use necessary cookies to run this shop. With your consent we also use cookies for analytics and marketing. Choose what you allow. | AC-SEC-007-01-01 |
| Sec.CookieSettingsSaved | Your cookie choices are saved. | AC-SEC-007-01-02 |
| Sec.ChainBroken | Audit trail integrity check failed. Investigation required. | AC-SEC-004-02-03 |
| Sec.AuditExportReady | Your audit export is ready to download. | AC-SEC-004-03-02 |
| Sec.AuditorAccessExpired | Your auditor access has ended. | AC-SEC-010-01-03 |
| Sec.DeadlineNotConfigured | The legal deadline for this case is not configured in the country profile. | AC-SEC-008-01-02 |
| Sec.ProfileIncomplete | The country data-protection profile is incomplete. | AC-SEC-012-01-02 |
| Sec.ServerSideAnalyticsBlocked | Server-side analytics events cannot be switched on: the country profile requires consent or is not configured. | AC-SEC-007-04-02 |
| Sec.FileAccessDenied | You do not have access to this file. | AC-SEC-002-04-02, AC-SEC-002-04-04, AC-SEC-002-04-05 |
| Sec.BreachNotice | We are writing to tell you about an incident that affected your personal data. | AC-SEC-008-02-01 (SMS text; emails use the breach message templates of the case) |

Default English text is Proposed. Every key is a locale resource (Definition of Done criterion 8); client language packs translate it. Native keys quoted in criteria (for example Common.WrongCaptchaMessage) are reused unchanged. Emails are sent by TRK-005 from the definitions of the SEC event codes (BR-SEC-100); a locale key alone sends nothing.


## 12. Integrations, contracts, events and concurrency

### 12.1 External interfaces

| Interface | Operations | Counterpart | Note |
|---|---|---|---|
| Hosting and edge (SEC-001, SEC-002, SEC-006) | TLS termination, WAF / DDoS, encryption at rest, region | Hosting / CDN provider (not named) | Project service; hosting checklist evidence |
| Security monitoring (SEC-005, IAM-012) | PushBatch (IC-SEC-02) | Monitoring system (not named) | P2 |
| Incident tool (SEC-015) | Evidence export | Not named | P2, external |
| Compliance / GRC tool (SEC-009) | Evidence files with manifests | Not named | P2, external |
| Vulnerability scanners and tracking (SEC-011) | Pipeline scan, runtime scan, findings tracking | Not named | External; DoD 5 |
| Captcha service (SEC-013) | Verify captcha token | reCAPTCHA (native CaptchaType) | Transfer record required (SEC-012) |
| Notification engine (SEC-004, SEC-005, SEC-008, SEC-010, SEC-012) | RegisterEventCode at installation; SendEvent for breach notices and staff alerts (IC-TRK-04) | PRD-TRK-005 | Internal (BR-SEC-100) |

### 12.2 Interface contracts

| Contract | Operation | Inputs | Outputs | Errors | nopCommerce mapping |
|---|---|---|---|---|---|
| IC-SEC-01 | WriteAsync | Event id (AUD-<AREA>-nnn), entity name, entity id, old values, new values, reason, correlation id | Sequence number | Validation error (unknown event id, missing actor); store unavailable (the calling operation fails, BR-SEC-015) | IAuditTrail service registered by the SEC plugin; the IRepository<> decorator uses the same store for entity changes |
| IC-SEC-01 | QueryAsync | Filters (actor, entity name, entity id, event id, store, date range, amount, sequence greater than a watermark), page size | Events with old and new values in sequence order; last sequence number of the page | Filter not allowed for the caller scope (SEC-010) | Read service; used by admin screens, IAM-018, RPT-006 and the RPT-003 change feed |
| IC-SEC-01 | ReplayAsync | Entity name and id, or customer id, and a point in time | Entity field values, or roles, permissions, ACL, store mappings, scopes and delegations at that time | No events before the time | Read service |
| IC-SEC-01 | VerifyAsync | Sequence range | Verified / Broken at sequence n | — | Scheduled task and on-demand action |
| IC-SEC-02 | PushBatch | Events in sequence order (audit, authentication, risk flags, system-log errors), batch id | Acknowledged up to sequence n | Endpoint unavailable, rejected batch | IScheduleTask; transport Not stated in source (Proposed: HTTPS with JSON lines) |
| IC-SEC-03 | GetProfile | Country code | Profile values (deadlines, response times, consent texts per purpose, transfer conditions, external AI and translation transfer rule, SMS opt-out duties and essential message types, whether server-side analytics events need consent, retention per record type) or "not configured" | Unknown country | Read service used by IAM-017, SEC-008, CHK-009, PLT-020, AI, CHN and FIN |
| IC-SEC-05 | EvaluateDownloadAccess (SEC download-ownership filter → registered rule providers: EGV-002, RET, CRM-001, ORD, SEL-002, DOC-002, LOG-012, TRK-003) | Download GUID and id, requesting user (customer, roles, vendor), area (storefront GetFileUpload or Admin DownloadFile) | NotClaimed / Allow / Deny with reason | Provider exception (treated as Deny, logged) | Provider interface defined by SEC; providers registered in DI and resolved as a list; called only by the single SEC filter (BR-SEC-005); a provider never adds its own filter to GetFileUpload or DownloadFile |
| IC-SEC-04 | GetFieldClass / Mask | Entity name, field name, value, user | Class and masking rule; masked or full value | Masking error (value hidden, BR-SEC-060) | SEC-014 service; used by the SEC result filter, the IExportManager override and CRM-003 |

Operation signatures (C# interfaces) are produced at L2 build start and approved by the tech lead; this table fixes the operations and their nopCommerce mapping. Every module that defines AUD-<AREA> events in its chapter calls IC-SEC-01 WriteAsync; entity old and new values are captured automatically and need no call.

### 12.3 Events

| Module event | Native nopCommerce event / mechanism | Consumers / effect |
|---|---|---|
| Audit.EntityChanged | None (captured inside the IRepository<> decorator, not from EntityInsertedEvent / EntityUpdatedEvent / EntityDeletedEvent) | Audit store; SEC-005 export |
| Audit.BusinessEvent | None (IC-SEC-01 WriteAsync call from the owning module service) | Audit store; SEC-005 export |
| Audit.ChainBroken | None (SEC event raised by the verification task) | Security officer notification |
| Consent.Changed | None (SEC event); native GDPR log entries for privacy-policy and newsletter consent | IAM-017 trail, analytics gating |
| Breach.DeadlineApproaching / Overdue | None (SEC scheduled task) | Privacy officer notification |
| SecuritySettings changed | SecuritySettingsChangedEvent (native) — notification only | Audit captures the Setting change through the decorator |

Event consumers in nopCommerce swallow exceptions (L1 §6.2 principle 8): money-moving logic runs in services, not in consumers; consumers only notify or enqueue jobs.

### 12.4 Concurrency and timing cases

| Case | Features | Required behaviour |
|---|---|---|
| Many requests write audit events at the same time | SEC-004 | Events are inserted with their content; sequence numbers and hashes are assigned by the chain writer under ILocker.PerformActionWithLockAsync keyed 'sec-audit-chain' (distributed when DistributedCacheConfig.Enabled; per host otherwise, L1 §6.4); with more than one web node the distributed cache must be enabled, otherwise two writers could build two chains |
| Verification runs while new events are appended | SEC-004 | Verification works on a fixed sequence range read at start; new events are verified in the next run |
| Entity change and audit insert in one request | SEC-004 | One transaction (BR-SEC-015); the audit row is written after the entity row and before commit |
| Auditor grant ends during a long export | SEC-010 | The export started inside the grant completes; requests after the end are denied |
| Two officers change the same breach case | SEC-008 | Plugin row version on BreachCase; the second save re-reads and fails with a conflict message (native optimistic pattern not used on core tables) |
| Export batch retried after a partial send | SEC-005 | The receiver acknowledges up to a sequence number; the next batch starts after it, so no event is sent twice in order or lost |


## 13. Notifications

| Trigger | Recipient | Channel | Feature |
|---|---|---|---|
| Audit chain broken | Security officer | Email + admin notification | SEC-004 |
| Audit export ready | Requesting user | Admin notification | SEC-004 |
| Security export backlog too old | Security officer | Email | SEC-005 |
| Breach deadline approaching / overdue | Privacy officer | Email + admin notification | SEC-008 |
| Breach notice to affected person | Affected customer | Email (breach templates) or SMS (Sec.BreachNotice) through TRK-005 | SEC-008 |
| Auditor access granted / ending / ended | Auditor; granting administrator | Email | SEC-010 |
| Impact assessment review date reached | Privacy officer | Email | SEC-012 |
| Country profile incomplete at go-live check | Client administrator; privacy officer | Admin notification | SEC-012 |


## 14. Reports and audit

### 14.1 Reports

| Report | Feature | Basis |
|---|---|---|
| Audit trail search results and exports with manifest | SEC-004 | REQ-MPC-AUD-001 |
| Compliance report: logins, admin actions, configuration changes | SEC-004 | REQ-MPC-FR-287 |
| Audit-chain verification results | SEC-004, SEC-009 | FC-M20-003 |
| Processing register, transfer records and impact assessments | SEC-012 | D |
| Breach cases with deadlines and notices | SEC-008 | FC-M21-014 |
| Control evidence export | SEC-009 | FC-M20-011 |

### 14.2 Audit event catalogue

| ID | Event | Actor | Entity | Fields recorded |
|---|---|---|---|---|
| AUD-SEC-001 | Entity inserted, updated or deleted (automatic) | Current user / system | Any audited entity | old values, new values, actor, impersonator, IP address, store |
| AUD-SEC-002 | Audit export generated or downloaded | Auditor / administrator | AuditExport | filter, formats, manifest hash |
| AUD-SEC-003 | Audit-chain verification failed | System | AuditChainCheckpoint | range, first bad sequence |
| AUD-SEC-004 | Auditor access granted, revoked or expired | Administrator / system | AuditorAccessGrant | auditor, dates, scope |
| AUD-SEC-005 | Breach case action (create, assess, notify, close) | Privacy officer | BreachCase | status, deadlines, counts, references |
| AUD-SEC-006 | Country profile, processing activity, transfer or impact assessment changed | Privacy officer | CountryPrivacyProfile, ProcessingActivity, TransferRecord, ImpactAssessment | old values, new values, version |
| AUD-SEC-007 | Cookie consent choice | Visitor / customer | CookieConsent | categories, banner version |
| AUD-SEC-008 | Masked value revealed | Staff user | Entity of the field | entity, field, reason |
| AUD-SEC-009 | Data classification or masking rule changed | Administrator / privacy officer | DataClassification, MaskingRule | old values, new values |
| AUD-SEC-010 | Security, captcha or GDPR setting changed | Administrator | Setting | setting name, old value, new value (secret values redacted) |
| AUD-SEC-011 | Security export failure or backlog alert | System | SecurityExportBatch | batch, attempts, error |
| AUD-SEC-012 | File access refused by the download-ownership filter | Requesting user | Download | download GUID, action (GetFileUpload / DownloadFile), deciding rule (base rule or provider), user |

SEC-004 is the audit trail itself; its own administrative actions are audited in the same chain. Names and fields are Proposed. Secret values are never written (BR-SEC-012).


## 15. Non-functional requirements

| ID | Requirement | Basis | Verified by |
|---|---|---|---|
| NFR-SEC-001 | All traffic is encrypted in transit; the minimum TLS version is Not stated in source (catalog target TLS 1.2 or higher, Proposed). | REQ-KTDA-SEC-002; REQ-MPC-SEC-001; FC-M21-002 | AC-SEC-001-01-01, AC-SEC-001-01-03 |
| NFR-SEC-002 | No card data stored or logged (NFR-X-001). | REQ-MPC-FR-148; REQ-KTDA-SEC-001 | AC-SEC-001-04-01, AC-SEC-003-02-01 |
| NFR-SEC-003 | Audit trail: every change of an audited entity has an event with old and new values; events are append-only and tamper-evident (NFR-X-003). | REQ-MPC-AUD-001; REQ-MPC-FR-287; FC-M20-002; FC-M20-003 | AC-SEC-004-01-01, AC-SEC-004-02-03; T-SEC-02 |
| NFR-SEC-004 | Audit write overhead and audit search response time: Not stated in source — requires confirmation. | NFR-X-009 | — (no target) |
| NFR-SEC-005 | Legal deadlines and response times come from the country profile; none is coded (NFR-X-002). | DP-01; Inference from REQ-KTDA-LEG-001 | AC-SEC-008-01-02, AC-SEC-012-01-02 |
| NFR-SEC-006 | No high or critical vulnerability in the dependency scan of any Increment (NFR-X-001, DoD 5). | NFR-X-001 | AC-SEC-011-01-01 |
| NFR-SEC-007 | Availability, recovery time and recovery point: Not stated in source (KG-18, MG-13). | NFR-X-009 | — (no target) |

Cross-cutting NFR-X-001 to NFR-X-009 (L1 §8.3) also apply.


## 16. Dependencies, phase and build order

| PRD ID | Phase | Depends on | Needed by |
|---|---|---|---|
| PRD-SEC-001 | P1 | PRD-PLT-007 | |
| PRD-SEC-002 | P1 | — | |
| PRD-SEC-003 | P1 | — | |
| PRD-SEC-004 | P1 | — | PRD-PLT-004, PRD-IAM-012, PRD-CAT-032, PRD-ORD-003, PRD-TRK-007, PRD-CRM-006 |
| PRD-SEC-005 | P2 | — | |
| PRD-SEC-006 | P1 | — | PRD-SEC-014 |
| PRD-SEC-007 | P1 | PRD-SEC-012 | |
| PRD-SEC-008 | P1 | PRD-SEC-012 | |
| PRD-SEC-009 | P2 | — | |
| PRD-SEC-010 | P2 | — | |
| PRD-SEC-011 | P1 | — | |
| PRD-SEC-012 | P1 | — | PRD-IAM-017, PRD-SEC-007, PRD-SEC-008 |
| PRD-SEC-013 | P1 | — | |
| PRD-SEC-014 | P2 | PRD-SEC-006 | |
| PRD-SEC-015 | P2 | — | |

Build order inside the module follows dependencies: the connector frameworks first, then adapters, then features that consume them. The Product Owner orders the Product Backlog; this list is not an order.


## 17. Test notes

| ID | Test note |
|---|---|
| T-SEC-01 | Transport: HTTP is redirected to HTTPS on every store; behind the proxy the auth cookie has the Secure flag; adapters refuse plain-HTTP endpoints. |
| T-SEC-02 | Audit capture: for each repository method (insert, update, delete, list variants, publishEvent false, predicate delete) and for SaveAclAsync and SaveStoreMappingsAsync an event with correct old and new values is written; redacted fields are never stored. |
| T-SEC-03 | Integrity: change, delete and reorder one event directly in the database; verification reports Broken at that sequence; export manifests verify. |
| T-SEC-04 | Fail closed: force the audit insert to fail; the entity change is rolled back. |
| T-SEC-05 | Cookie consent: with analytics not accepted no analytics widget is rendered and no analytics request leaves the browser; with functional not accepted the AI chat widget is not rendered; GoogleAnalyticsSettings.EnableEcommerce cannot be set while the profile requires consent or is not configured. |
| T-SEC-06 | Auditor access: every create, edit and delete is denied; access ends at the grant end on the next request. |
| T-SEC-07 | Country profile: with a missing deadline, breach cases and privacy requests show "not configured" and the go-live check fails. |
| T-SEC-08 | Extension register: each interface in BR-ADM-001 has exactly one overriding plugin (owners per OVR-REG); SEC-owned entries of BR-SEC-070 are in it; startup order is checked. |
| T-SEC-09 | State models: every transition in §8.2 is tested; every transition not listed is rejected. |
| T-SEC-10 | Permissions: each permission in §4 has an allow and a deny case (§4.1); no permission allows changing an audit event. |
| T-SEC-11 | Uploaded files: uploader, order staff, vendor of the product and a stranger request GetFileUpload and Admin DownloadFile; only the allowed users get the file; for a file claimed by a provider (EGV) only the provider decision applies; exactly one ownership filter is registered on each action. |
| T-SEC-12 | Setting audit: insert, update and delete of a normal key and of a secret key; the secret value is never in the audit store; the change feed query with a watermark returns every event once in order. |
| T-SEC-13 | Known platform findings of BR-SEC-081 are retested in each penetration test with the product controls active. |
