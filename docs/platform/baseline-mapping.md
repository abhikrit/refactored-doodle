# nopCommerce 5.00.1 baseline mapping

This prototype has no .NET and no database (see `CLAUDE.md`, conflicts C-1 and C-2). The
nopCommerce 5.00.1 baseline is therefore pinned in `platform/baseline.json` and mapped here, so
the later .NET build inherits the vocabulary rather than re-deriving it.

Every path below is relative to `src/` of the official `release-5.00.1` tag, as L1 section 6.1
cites them. Nothing in this repository was copied from that source; the mapping is from the PRD.

## 1. Services and seams

| Prototype file | nopCommerce 5.00.1 counterpart | Owned by | Rule |
|---|---|---|---|
| `packages/server/src/core/repository.js` | `Libraries/Nop.Data/IRepository.cs` (async members only; the synchronous ones were removed in 5.00) | SEC-004 decorator | CLAUDE.md "5.00.1 is async-only" |
| `packages/server/src/core/settings.js` | `Libraries/Nop.Services/Configuration/SettingService.LoadSettingAsync`; `Setting.StoreId` | PLT-004 | L1 section 6.5: store value, else StoreId 0 |
| `packages/server/src/core/pack-loader.js` | no native counterpart - the PLT-003 pack loader is a build | PLT-003 | BR-PLT-010 merge order |
| `packages/server/src/core/providers.js` | DI registration + `INopStartup` order | all override hosts | Decision OVR-REG, L1 section 6.2 principle 7 |
| `packages/server/src/core/events.js` | `Libraries/Nop.Core/Events/IEventPublisher` (async only in 5.00) | all consumers | L1 section 6.2 principle 8 |
| `packages/server/src/core/locker.js` | `ILocker`; `OrderSettings.PlaceOrderWithLock` is a host-local Mutex (`OrderProcessingService.cs:1681-1717`) | CHK-003 | Decision SINGLE-NODE for P1 |
| `packages/server/src/core/audit.js` | no native counterpart - SEC-004 is a build | SEC-004 | CLAUDE.md "audit through SEC-004" |
| `packages/server/src/core/messages.js` | `MessageTemplate` + the TRK-005 notification engine (new) | TRK-005 | Decision MSG-ROUTE |
| `packages/server/src/core/permissions.js` | `CustomerRole`, `PermissionRecord`, `PermissionRecordCustomerRoleMapping`, `IPermissionConfigManager` | IAM-007 / IAM-008 | 5.00.1 system names with the view / create-edit-delete split |
| `packages/server/src/core/plugin-host.js` | `BasePlugin` / `IPlugin` / `PluginDescriptor`, `App_Data/plugins.json`, `plugin.json` | - | plugin.json `SupportedVersions: 5.00` (VER-500) |

## 2. Override register as the prototype claims it

| nopCommerce service | Owner in this prototype | Feature | Note |
|---|---|---|---|
| `ISettingService` | `Product.PLT` | PRD-PLT-004 | settings change control; held by WF-ENG, prototype records the change in the audit trail |
| `IRepository<>` | `Product.SEC` | PRD-SEC-004 | audit decorator; async members only |
| `ICustomerImpersonationFilter` | `Product.IAM` | PRD-IAM-026 | BR-IAM-130, decision SINGLE-FILTER |
| `IProductService` | `Product.CAT` | PRD-CAT-002 | product record host |
| `IPriceCalculationService` | `Product.CAT` | PRD-CAT-039 | price lists first, then a tier price replaces them (PRICE-500) |
| `ISearchProvider` | `Product.SRC` | PRD-SRC-001 | Search.Lucene in 5.00.1 implements `IMiscPlugin`, not `ISearchProvider`, so it cannot be selected (PAID-STUB) |
| `IShoppingCartService` | `Product.CHK` | PRD-CHK-003 | BR-CHK-015, cart check providers after the native checks |
| `IOrderProcessingService` | `Product.CHK` | PRD-CHK-003 | BR-CHK-006 placement host |
| `IPaymentService` | `Product.PAY` | PRD-PAY-001 | method offer and routing |
| `IOrderService` | `Product.ORD` | PRD-ORD-001 | order console and stage model |
| `IShippingService` | `Product.LOG` | PRD-LOG-002 | delivery fee rules |
| `INotificationService` | `Product.TRK` | PRD-TRK-005 | multi-channel messaging |

The registry refuses a second claim on a service, so a module can only plug in through the
owner's contract (`IC-...`).

## 3. Entities

The prototype's in-memory tables use the nopCommerce entity names, so the data model ports
directly: `Customer`, `CustomerRole`, `PermissionRecord`, `PermissionRecordCustomerRoleMapping`,
`Setting`, `Store`, `Language`, `Currency`, `StateProvince`, `Category`, `Product`, `Vendor`,
`PriceList`, `ShoppingCartItem`, `Order`, `OrderItem`, `Shipment`, `ShippingMethod`,
`StorePickupPoint`, plus the new entities the PRD names: `CheckoutSession`, `PickupCode`,
`DeliverySlotDefinition`, `DeliverySlotReservation`, `ProofOfDelivery`, `TrackingEvent`,
`PaymentTransaction`, `MessageDelivery`, `AuditEntry`, `CheckoutException`.

## 4. Configuration rules carried from the decisions

| Decision | Rule | Where it shows |
|---|---|---|
| VER-500 | every installation runs 5.00.1 on .NET 10; packs use 5.00.1 keys and permission names | `platform/baseline.json`, every `plugin.json` |
| CART-500 | `shoppingcartsettings.vendorenabled` and `.vendorrequired` stay false; one cart, split order and payment | `packs/global/global.json`, CHK-004 splitter |
| PRICE-500 | CAT-039 / CAT-042 use native price lists; a tier price replaces the price-list price | `product-cat/services/catalogue.js` |
| SINGLE-NODE | P1 serves checkout from one web node | `core/locker.js` |
| CFG-01 / BR-PLT-013 | a secret never travels in a pack | `core/pack-loader.js` validation |

## 5. What a developer must still check against the real tag

- Every file path cited above, against `release-5.00.1`, before the .NET build starts.
- Whether .NET 10 runs on Windows Server 2019 (REQ-MPC-ARC-004, open item HOST-500).
- The 5.00 builds, licences and scope of the 11 licensed plugins and the 6 paid stubs (V-01 /
  VENDOR-500); the prototype substitutes them in-house under decision P-2.
