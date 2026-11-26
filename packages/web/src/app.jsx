import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ProductProvider, useProduct } from './lib/store.jsx';
import { StorefrontShell } from './ui/nop/shells.jsx';
import { Alert, Spinner } from './ui/nop/kit.jsx';

import { Home, ProductList, ProductDetails } from './surfaces/storefront/catalog.jsx';
import { Cart, Checkout, OrderCompleted } from './surfaces/storefront/checkout.jsx';
import {
  AccountAddresses, AccountInfo, AccountOrderDetails, AccountOrders, AccountWishlist, Login,
  Register,
} from './surfaces/storefront/account.jsx';
import {
  AccountNotifications, OrderStatus, PublicTracking, SharedTracking,
} from './surfaces/storefront/tracking.jsx';
import {
  AcceptTerms, AccountActivity, AccountCompany, AccountDashboard, AccountHistory,
  AccountPreferences, AccountPrivacy, TradeApplication,
} from './surfaces/storefront/account-identity.jsx';
import { CookieSettings } from './surfaces/storefront/cookies.jsx';

import {
  AdminCategories, AdminCheckoutExceptions, AdminOrderDetails, AdminOrders, AdminPayments,
  AdminPriceLists, AdminProductEdit, AdminProducts, AdminRoles, AdminShipments, AdminVendors,
  Dashboard,
} from './surfaces/admin/index.jsx';
import {
  AdminAccess, AdminAccounts, AdminCustomers, AdminPrivacy, AdminSecurity,
} from './surfaces/admin/iam.jsx';
import {
  AdminAuditTrail, AdminBreaches, AdminDataProtection, AdminSecurityOperations,
} from './surfaces/admin/sec.jsx';
import {
  AdminAcl, AdminCurrencies, AdminFeatureRegistry, AdminLanguages, AdminMessageTemplates,
  AdminPacks, AdminPaymentMethods, AdminSettings, AdminShippingMethods, AdminStores,
} from './surfaces/admin/configuration.jsx';
import { AdminDeliveryWindows } from './surfaces/admin/chk.jsx';
import {
  AdminChangeSets, AdminCountries, AdminHelpContent, AdminRetention,
} from './surfaces/admin/plt.jsx';
import {
  AdminEmailTemplates, AdminNotificationDefinitions, AdminNotificationLog,
} from './surfaces/admin/trk.jsx';
import {
  AdminOutreach, AdminSellerShipments, AdminTrackAndTrace, AdminTrackingConfiguration,
} from './surfaces/admin/trk-hub.jsx';
import { AdminPlugins } from './surfaces/admin/system.jsx';
import {
  AdminConsole, BulkEdit, ExtensionRegister, Maintenance, ScheduleTasks, SystemLog, Widgets,
} from './surfaces/admin/adm001.jsx';
import {
  Eligibility, Rules, Templates, TransactionTypes, UploadPolicy, Workflows,
} from './surfaces/admin/adm-config.jsx';
import {
  Alerts, Approvals, Exceptions, OperationsConsole,
} from './surfaces/admin/adm-operations.jsx';

const store = (el) => <StorefrontShell>{el}</StorefrontShell>;

function Boot({ children }) {
  const { busy, error, meta } = useProduct();
  if (error) {
    return (
      <div className="p-6 max-w-xl mx-auto">
        <Alert tone="error" title="The prototype could not start">{error}</Alert>
      </div>
    );
  }
  if (busy && !meta) {
    return <div className="p-10"><Spinner label="Applying the client configuration pack and seeding synthetic data" /></div>;
  }
  return children;
}

export default function App() {
  return (
    <ProductProvider>
      <div className="min-h-screen flex flex-col">
        <div className="flex-1 min-h-0">
          <Boot>
            <Routes>
              {/* storefront - DefaultClean */}
              <Route path="/" element={store(<Home />)} />
              <Route path="/search" element={store(<ProductList mode="search" />)} />
              <Route path="/category/:categoryId" element={store(<ProductList mode="category" />)} />
              <Route path="/product/:id" element={store(<ProductDetails />)} />
              <Route path="/cart" element={store(<Cart />)} />
              <Route path="/checkout" element={store(<Checkout />)} />
              <Route path="/order-completed" element={store(<OrderCompleted />)} />
              <Route path="/login" element={store(<Login />)} />
              <Route path="/register" element={store(<Register />)} />
              <Route path="/order-status" element={store(<OrderStatus />)} />
              <Route path="/track/share/:token" element={store(<SharedTracking />)} />
              <Route path="/track/:trackingNumber" element={store(<PublicTracking />)} />
              <Route path="/account" element={store(<AccountInfo />)} />
              <Route path="/account/orders" element={store(<AccountOrders />)} />
              <Route path="/account/orders/:orderNumber" element={store(<AccountOrderDetails />)} />
              <Route path="/account/addresses" element={store(<AccountAddresses />)} />
              <Route path="/account/wishlist" element={store(<AccountWishlist />)} />
              <Route path="/account/dashboard" element={store(<AccountDashboard />)} />
              <Route path="/account/history" element={store(<AccountHistory />)} />
              <Route path="/account/preferences" element={store(<AccountPreferences />)} />
              <Route path="/account/notifications" element={store(<AccountNotifications />)} />
              <Route path="/account/privacy" element={store(<AccountPrivacy />)} />
              <Route path="/account/activity" element={store(<AccountActivity />)} />
              <Route path="/account/company" element={store(<AccountCompany />)} />
              <Route path="/account/trade-application" element={store(<TradeApplication />)} />
              <Route path="/customer/accept-terms" element={store(<AcceptTerms />)} />
              <Route path="/cookie-settings" element={store(<CookieSettings />)} />

              {/* administration */}
              <Route path="/admin" element={<Dashboard />} />
              <Route path="/admin/console" element={<AdminConsole />} />
              <Route path="/admin/catalog/products" element={<AdminProducts />} />
              <Route path="/admin/catalog/bulk-edit" element={<BulkEdit />} />
              <Route path="/admin/catalog/products/:id" element={<AdminProductEdit />} />
              <Route path="/admin/customers" element={<AdminCustomers />} />
              <Route path="/admin/customers/security" element={<AdminSecurity />} />
              <Route path="/admin/customers/access" element={<AdminAccess />} />
              <Route path="/admin/customers/privacy" element={<AdminPrivacy />} />
              <Route path="/admin/customers/business" element={<AdminAccounts />} />
              <Route path="/admin/configuration/settings" element={<AdminSettings />} />
              <Route path="/admin/configuration/packs" element={<AdminPacks />} />
              <Route path="/admin/configuration/change-sets" element={<AdminChangeSets />} />
              <Route path="/admin/configuration/feature-registry" element={<AdminFeatureRegistry />} />
              <Route path="/admin/configuration/stores" element={<AdminStores />} />
              <Route path="/admin/configuration/languages" element={<AdminLanguages />} />
              <Route path="/admin/configuration/currencies" element={<AdminCurrencies />} />
              <Route path="/admin/configuration/countries" element={<AdminCountries />} />
              <Route path="/admin/configuration/payment-methods" element={<AdminPaymentMethods />} />
              <Route path="/admin/configuration/shipping-methods" element={<AdminShippingMethods />} />
              <Route path="/admin/configuration/delivery-windows" element={<AdminDeliveryWindows />} />
              <Route path="/admin/configuration/acl" element={<AdminAcl />} />
              <Route path="/admin/configuration/retention" element={<AdminRetention />} />
              <Route path="/admin/content/help" element={<AdminHelpContent />} />
              <Route path="/admin/content/message-templates" element={<AdminEmailTemplates />} />
              <Route path="/admin/content/notifications" element={<AdminNotificationDefinitions />} />
              <Route path="/admin/content/locale-resources" element={<AdminMessageTemplates />} />
              <Route path="/admin/system/notification-log" element={<AdminNotificationLog />} />
              <Route path="/admin/operations/track-and-trace" element={<AdminTrackAndTrace />} />
              <Route path="/admin/operations/notices" element={<AdminOutreach />} />
              <Route path="/admin/sales/orders" element={<AdminOrders />} />
              <Route path="/admin/sales/orders/:orderNumber" element={<AdminOrderDetails />} />
              <Route path="/admin/sales/checkout-exceptions" element={<AdminCheckoutExceptions />} />
              <Route path="/admin/sales/payments" element={<AdminPayments />} />
              <Route path="/admin/sales/shipments" element={<AdminSellerShipments />} />
              <Route path="/admin/sales/shipment-list" element={<AdminShipments />} />
              <Route path="/admin/catalog/categories" element={<AdminCategories />} />
              <Route path="/admin/catalog/price-lists" element={<AdminPriceLists />} />
              <Route path="/admin/customers/roles" element={<AdminRoles />} />
              <Route path="/admin/customers/vendors" element={<AdminVendors />} />
              <Route path="/admin/configuration/tracking" element={<AdminTrackingConfiguration />} />
              <Route path="/admin/configuration/widgets" element={<Widgets />} />
              <Route path="/admin/system/schedule-tasks" element={<ScheduleTasks />} />
              <Route path="/admin/system/log" element={<SystemLog />} />
              <Route path="/admin/system/maintenance" element={<Maintenance />} />
              <Route path="/admin/system/extension-register" element={<ExtensionRegister />} />
              <Route path="/admin/system/audit-trail" element={<AdminAuditTrail />} />
              <Route path="/admin/system/data-protection" element={<AdminDataProtection />} />
              <Route path="/admin/system/breaches" element={<AdminBreaches />} />
              <Route path="/admin/system/security-operations" element={<AdminSecurityOperations />} />
              <Route path="/admin/configuration/workflows" element={<Workflows />} />
              <Route path="/admin/configuration/rules" element={<Rules />} />
              <Route path="/admin/configuration/transaction-types" element={<TransactionTypes />} />
              <Route path="/admin/configuration/eligibility" element={<Eligibility />} />
              <Route path="/admin/configuration/upload-policy" element={<UploadPolicy />} />
              <Route path="/admin/configuration/templates" element={<Templates />} />
              <Route path="/admin/operations" element={<OperationsConsole />} />
              <Route path="/admin/operations/approvals" element={<Approvals />} />
              <Route path="/admin/operations/exceptions" element={<Exceptions />} />
              <Route path="/admin/operations/alerts" element={<Alerts />} />
              <Route path="/admin/plugins" element={<AdminPlugins />} />


              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Boot>
        </div>
      </div>
    </ProductProvider>
  );
}
