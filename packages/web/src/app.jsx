import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ProductProvider, useProduct } from './lib/store.jsx';
import { PrototypeBar, StorefrontShell } from './ui/nop/shells.jsx';
import { Alert, Spinner } from './ui/nop/kit.jsx';

import { Home, ProductList, ProductDetails } from './surfaces/storefront/catalog.jsx';
import { Cart, Checkout, OrderCompleted } from './surfaces/storefront/checkout.jsx';
import {
  AccountAddresses, AccountInfo, AccountOrderDetails, AccountOrders, AccountWishlist, Login,
  OrderStatus, PublicTracking, Register,
} from './surfaces/storefront/account.jsx';

import {
  AdminCategories, AdminCheckoutExceptions, AdminCustomers, AdminOrderDetails, AdminOrders,
  AdminPayments, AdminPriceLists, AdminProductEdit, AdminProducts, AdminRoles, AdminShipments,
  AdminVendors, Dashboard,
} from './surfaces/admin/index.jsx';
import {
  AdminAcl, AdminCurrencies, AdminFeatureRegistry, AdminLanguages, AdminMessageTemplates,
  AdminPacks, AdminPaymentMethods, AdminSettings, AdminShippingMethods, AdminStores,
} from './surfaces/admin/configuration.jsx';
import {
  AdminAudit, AdminDiagnostics, AdminMessages, AdminMocks, AdminPlugins, AdminScreens,
  AdminTracking,
} from './surfaces/admin/system.jsx';

import {
  AdminConsole, BulkEdit, ExtensionRegister, Maintenance, ScheduleTasks, SystemLog, Widgets,
} from './surfaces/admin/adm001.jsx';
import { SellerDashboard, SellerList } from './surfaces/seller/index.jsx';
import { OutletCounter } from './surfaces/outlet/index.jsx';
import {
  AreaDetail, AreaList, Decisions, FeatureDetail, FeatureList, GroupDetail, GroupList, Journeys,
  Overview, Requirements, RoleDetail, RoleList, Trace,
} from './surfaces/explorer/index.jsx';

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
      <div className="min-h-full flex flex-col">
        <PrototypeBar />
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
              <Route path="/track/:trackingNumber" element={store(<PublicTracking />)} />
              <Route path="/account" element={store(<AccountInfo />)} />
              <Route path="/account/orders" element={store(<AccountOrders />)} />
              <Route path="/account/orders/:orderNumber" element={store(<AccountOrderDetails />)} />
              <Route path="/account/addresses" element={store(<AccountAddresses />)} />
              <Route path="/account/wishlist" element={store(<AccountWishlist />)} />

              {/* administration */}
              <Route path="/admin" element={<Dashboard />} />
              <Route path="/admin/console" element={<AdminConsole />} />
              <Route path="/admin/catalog/products" element={<AdminProducts />} />
              <Route path="/admin/catalog/bulk-edit" element={<BulkEdit />} />
              <Route path="/admin/catalog/products/:id" element={<AdminProductEdit />} />
              <Route path="/admin/catalog/categories" element={<AdminCategories />} />
              <Route path="/admin/catalog/price-lists" element={<AdminPriceLists />} />
              <Route path="/admin/sales/orders" element={<AdminOrders />} />
              <Route path="/admin/sales/orders/:orderNumber" element={<AdminOrderDetails />} />
              <Route path="/admin/sales/shipments" element={<AdminShipments />} />
              <Route path="/admin/sales/payments" element={<AdminPayments />} />
              <Route path="/admin/sales/checkout-exceptions" element={<AdminCheckoutExceptions />} />
              <Route path="/admin/customers" element={<AdminCustomers />} />
              <Route path="/admin/customers/roles" element={<AdminRoles />} />
              <Route path="/admin/customers/vendors" element={<AdminVendors />} />
              <Route path="/admin/configuration/settings" element={<AdminSettings />} />
              <Route path="/admin/configuration/packs" element={<AdminPacks />} />
              <Route path="/admin/configuration/features" element={<AdminFeatureRegistry />} />
              <Route path="/admin/configuration/stores" element={<AdminStores />} />
              <Route path="/admin/configuration/languages" element={<AdminLanguages />} />
              <Route path="/admin/configuration/currencies" element={<AdminCurrencies />} />
              <Route path="/admin/configuration/payment-methods" element={<AdminPaymentMethods />} />
              <Route path="/admin/configuration/shipping-methods" element={<AdminShippingMethods />} />
              <Route path="/admin/configuration/widgets" element={<Widgets />} />
              <Route path="/admin/configuration/acl" element={<AdminAcl />} />
              <Route path="/admin/configuration/message-templates" element={<AdminMessageTemplates />} />
              <Route path="/admin/system/schedule-tasks" element={<ScheduleTasks />} />
              <Route path="/admin/system/log" element={<SystemLog />} />
              <Route path="/admin/system/maintenance" element={<Maintenance />} />
              <Route path="/admin/system/extension-register" element={<ExtensionRegister />} />
              <Route path="/admin/system/audit" element={<AdminAudit />} />
              <Route path="/admin/system/messages" element={<AdminMessages />} />
              <Route path="/admin/system/tracking" element={<AdminTracking />} />
              <Route path="/admin/system/mocks" element={<AdminMocks />} />
              <Route path="/admin/system/diagnostics" element={<AdminDiagnostics />} />
              <Route path="/admin/plugins" element={<AdminPlugins />} />
              <Route path="/admin/screens" element={<AdminScreens />} />

              {/* seller portal and outlet counter */}
              <Route path="/seller" element={<SellerList />} />
              <Route path="/seller/:id" element={<SellerDashboard />} />
              <Route path="/outlet" element={<OutletCounter />} />

              {/* product explorer */}
              <Route path="/explorer" element={<Overview />} />
              <Route path="/explorer/features" element={<FeatureList />} />
              <Route path="/explorer/features/:id" element={<FeatureDetail />} />
              <Route path="/explorer/areas" element={<AreaList />} />
              <Route path="/explorer/areas/:code" element={<AreaDetail />} />
              <Route path="/explorer/groups" element={<GroupList />} />
              <Route path="/explorer/groups/:id" element={<GroupDetail />} />
              <Route path="/explorer/roles" element={<RoleList />} />
              <Route path="/explorer/roles/:id" element={<RoleDetail />} />
              <Route path="/explorer/journeys" element={<Journeys />} />
              <Route path="/explorer/requirements" element={<Requirements />} />
              <Route path="/explorer/decisions" element={<Decisions />} />
              <Route path="/explorer/trace" element={<Trace />} />

              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Boot>
        </div>
      </div>
    </ProductProvider>
  );
}
