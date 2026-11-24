// SEL - sellers and the seller portal read model.
//
// SEL-001 application and profile, SEL-008 seller home page, SEL-011 performance, SEL-016
// commission rules. Most of SEL is held by C-SELLER (Malawi Post) or by the KTDA seller-model
// gap KG-01, so the prototype shows the Proposed option labelled with the decision (P-1).

import { repository } from '../../../core/repository.js';

export async function sellersAsync() {
  return repository('Vendor').getAllAsync();
}

export async function sellerDashboardAsync(vendorId) {
  const vendor = await repository('Vendor').getByIdAsync(vendorId);
  if (!vendor) return null;
  const [products, orders] = await Promise.all([
    repository('Product').getAllAsync((p) => p.vendorId === Number(vendorId)),
    repository('Order').getAllAsync((o) => o.vendorId === Number(vendorId)),
  ]);
  const commissionRate = 0.08;
  return {
    vendor,
    products: products.length,
    orders: orders.length,
    openOrders: orders.filter((o) => !['Delivered', 'Cancelled'].includes(o.stage)).length,
    revenue: Number(orders.reduce((s, o) => s + o.subtotal, 0).toFixed(2)),
    commission: Number(orders.reduce((s, o) => s + o.subtotal * commissionRate, 0).toFixed(2)),
    commissionRate,
    commissionNote: 'Commission rules (SEL-016) are a client configuration; this rate is a prototype default, not a client value.',
    recentOrders: orders.slice(-5).reverse(),
  };
}
