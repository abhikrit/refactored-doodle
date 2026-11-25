import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ProductProvider, useProduct } from './lib/store.jsx';
import { StorefrontShell } from './ui/nop/shells.jsx';
import { Alert, Spinner } from './ui/nop/kit.jsx';

import { Home, ProductList, ProductDetails } from './surfaces/storefront/catalog.jsx';
import { Cart, Checkout, OrderCompleted } from './surfaces/storefront/checkout.jsx';
import {
  AccountAddresses, AccountInfo, AccountOrderDetails, AccountOrders, AccountWishlist, Login,
  OrderStatus, PublicTracking, Register,
} from './surfaces/storefront/account.jsx';

import {
  AdminCustomers, AdminProductEdit, AdminProducts, Dashboard,
} from './surfaces/admin/index.jsx';
import { AdminSettings } from './surfaces/admin/configuration.jsx';
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
              <Route path="/admin/customers" element={<AdminCustomers />} />
              <Route path="/admin/configuration/settings" element={<AdminSettings />} />
              <Route path="/admin/configuration/widgets" element={<Widgets />} />
              <Route path="/admin/system/schedule-tasks" element={<ScheduleTasks />} />
              <Route path="/admin/system/log" element={<SystemLog />} />
              <Route path="/admin/system/maintenance" element={<Maintenance />} />
              <Route path="/admin/system/extension-register" element={<ExtensionRegister />} />
              {/* PRD-ADM-002 to PRD-ADM-012 */}
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
