// Storefront cart and checkout - the native pages, extended as the CHK chapter states.
//   Cart            CHK-001 (+ saved for later), CHK-005 fulfilment per line
//   Checkout        CHK-002 steps with CheckoutProgress, CHK-005, CHK-006 windows, CHK-009 notices
//   Confirm         CHK-002/003 server-side totals and validation, CHK-004 split, CHK-016 credit
//   Completed       CHK-019 confirmation with the checkout reference and the sub-orders, CHK-012 code

import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../../lib/api.js';
import { useProduct, money } from '../../lib/store.jsx';
import {
  Alert, Badge, Button, Checkbox, Field, Input, Panel, ProductPicture, Select, Spinner,
} from '../../ui/nop/kit.jsx';

/* --------------------------------------------------------------------- cart --- */

export function Cart() {
  const { cart, refreshCart, settings } = useProduct();
  const navigate = useNavigate();
  const [warnings, setWarnings] = useState([]);
  const [points, setPoints] = useState([]);
  const [terms, setTerms] = useState(false);
  const termsOnCart = settings('ordersettings.termsofserviceonshoppingcartpage', false);
  const allowSaveForLater = settings('shoppingcartsettings.allowmultiplewishlist', false);

  useEffect(() => { api.get('/logistics/pickup-points').then(setPoints).catch(() => {}); }, []);
  useEffect(() => { refreshCart(); }, [refreshCart]);

  if (!cart) return <Spinner />;
  const currency = cart.items[0]?.product?.currency ?? 'USD';

  const update = async (itemId, body) => {
    const res = await api.patch(`/checkout-area/cart/items/${itemId}`, body);
    setWarnings(res.warnings ?? []);
    await refreshCart();
  };
  const remove = async (itemId) => { await api.del(`/checkout-area/cart/items/${itemId}`); await refreshCart(); };
  const saveForLater = async (itemId, back) => {
    const res = await api.post(`/checkout-area/cart/items/${itemId}/save-for-later`, { back });
    setWarnings(res.warnings ?? []);
    await refreshCart();
  };

  return (
    <div className="space-y-5">
      <h1 className="nop-page-title">Shopping cart</h1>
      {warnings.length > 0 && <Alert tone="warning">{warnings.join(' ')}</Alert>}

      {cart.items.length === 0 ? (
        <Alert tone="info">Your shopping cart is empty. <Link to="/search" className="underline">Browse the catalogue</Link>.</Alert>
      ) : (
        <>
          <div className="border border-store-border bg-white overflow-x-auto">
            <table className="w-full text-[13px]">
              <thead className="bg-nop-head text-[12.5px] text-gray-600">
                <tr>
                  <th className="text-left px-3 py-2 font-medium">Picture</th>
                  <th className="text-left px-3 py-2 font-medium">Product</th>
                  <th className="text-left px-3 py-2 font-medium">Fulfilment</th>
                  <th className="text-right px-3 py-2 font-medium">Unit price</th>
                  <th className="text-center px-3 py-2 font-medium">Quantity</th>
                  <th className="text-right px-3 py-2 font-medium">Total</th>
                  <th className="px-3 py-2" />
                </tr>
              </thead>
              <tbody>
                {cart.items.map((item) => (
                  <tr key={item.id} className="border-t border-nop-border align-top">
                    <td className="px-3 py-3 w-20"><div className="w-14"><ProductPicture picture={item.product.picture} name={item.product.name} size="sm" /></div></td>
                    <td className="px-3 py-3">
                      <Link to={`/product/${item.productId}`} className="font-medium hover:brand-text">{item.product.name}</Link>
                      <div className="text-[12px] text-nop-muted mt-0.5 font-mono">{item.product.sku}</div>
                      <div className="mt-1 flex flex-wrap gap-1.5">
                        <Badge tone="slate">{item.product.vendor?.name}</Badge>
                        {item.priceParts?.applied === 'price-list' && <Badge tone="green">Price list</Badge>}
                        {item.priceParts?.applied === 'tier-price' && <Badge tone="blue">Tier price</Badge>}
                      </div>
                    </td>
                    <td className="px-3 py-3 w-64">
                      <Select
                        value={item.fulfilment}
                        onChange={(e) => update(item.id, { fulfilment: e.target.value, pickupPointId: e.target.value === 'pickup' ? (points[0]?.id ?? null) : null })}
                        aria-label={`Fulfilment for ${item.product.name}`}
                      >
                        <option value="delivery" disabled={item.product.pickupOnly}>Home delivery</option>
                        <option value="pickup">Collect at an outlet</option>
                      </Select>
                      {item.fulfilment === 'pickup' && (
                        <Select
                          className="mt-1.5"
                          value={item.pickupPointId ?? ''}
                          onChange={(e) => update(item.id, { pickupPointId: Number(e.target.value) })}
                          aria-label={`Outlet for ${item.product.name}`}
                        >
                          <option value="">Choose an outlet…</option>
                          {points.map((p) => <option key={p.id} value={p.id}>{p.name} - {p.city}</option>)}
                        </Select>
                      )}
                      {item.product.pickupOnly && <p className="text-[11.5px] text-amber-800 mt-1">This item can only be collected from an outlet.</p>}
                    </td>
                    <td className="px-3 py-3 text-right">{money(item.unitPrice, currency)}</td>
                    <td className="px-3 py-3 text-center">
                      <input
                        type="number"
                        min="0"
                        value={item.quantity}
                        onChange={(e) => update(item.id, { quantity: Number(e.target.value) })}
                        className="w-20 border border-nop-border rounded-sm px-2 py-1.5 text-center"
                        aria-label={`Quantity of ${item.product.name}`}
                      />
                    </td>
                    <td className="px-3 py-3 text-right font-medium">{money(item.subtotal, currency)}</td>
                    <td className="px-3 py-3 text-right whitespace-nowrap">
                      {allowSaveForLater && <Button size="sm" onClick={() => saveForLater(item.id, false)}>Save for later</Button>}
                      <Button size="sm" variant="danger" className="ml-1.5" onClick={() => remove(item.id)}>Remove</Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {cart.multiSeller && (
            <Alert tone="info" title="One cart, several sellers">
              This cart holds items from {cart.sellers.length} sellers. One payment is taken and the order is split into
              one sub-order per seller and fulfilment choice at placement.
</Alert>
          )}

          <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
            <div className="space-y-4">
              {cart.savedForLater.length > 0 && (
                <Panel title={cart.savedForLaterName} subtitle="Items you saved to buy later">
                  <ul className="divide-y divide-gray-100">
                    {cart.savedForLater.map((item) => (
                      <li key={item.id} className="flex items-center gap-3 py-2">
                        <div className="w-10"><ProductPicture picture={item.product.picture} name={item.product.name} size="sm" /></div>
                        <span className="flex-1 text-[13px]">{item.product.name}</span>
                        <span className="text-[13px] text-nop-muted">{money(item.unitPrice, currency)}</span>
                        <Button size="sm" onClick={() => saveForLater(item.id, true)}>Move to cart</Button>
                      </li>
                    ))}
                  </ul>
</Panel>
              )}
              <Panel title="Estimate shipping" subtitle="Native cart block (ShippingSettings.EstimateShippingCartPageEnabled)">
                <p className="text-[13px] text-nop-muted">
                  Delivery fees are calculated per seller group by the LOG-002 fee engine and shown at checkout.
                </p>
              </Panel>
            </div>

            <div className="space-y-3">
              <Panel title="Order summary" bodyClass="p-3 bg-store-totals">
                <div className="flex justify-between text-[13px] py-1"><span>Sub-total</span><span className="font-medium">{money(cart.subtotal, currency)}</span></div>
                <div className="flex justify-between text-[12.5px] py-1 text-nop-muted"><span>Delivery</span><span>calculated at checkout</span></div>
                <div className="flex justify-between text-[12.5px] py-1 text-nop-muted"><span>Tax</span><span>calculated at checkout</span></div>
                {termsOnCart && (
                  <div className="mt-2 pt-2 border-t border-nop-border">
                    <Checkbox label="I agree with the terms of service" checked={terms} onChange={(e) => setTerms(e.target.checked)} />
                  </div>
                )}
                <Button
                  variant="brand"
                  size="lg"
                  className="w-full mt-3"
                  disabled={termsOnCart && !terms}
                  onClick={() => navigate('/checkout')}
                >
                  Checkout
                </Button>
</Panel>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

/* ----------------------------------------------------------------- checkout --- */

const STEP_LABELS = {
  billing: 'Billing address',
  shipping: 'Shipping address',
  'shipping-method': 'Shipping method',
  'payment-method': 'Payment method',
  'payment-info': 'Payment information',
  confirm: 'Confirm order',
};

function CheckoutProgress({ steps, current }) {
  const index = steps.findIndex((s) => s.id === current);
  return (
    <ol className="nop-order-progress flex flex-wrap items-start justify-center gap-x-6 gap-y-3">
      {steps.map((s, i) => (
        <li key={s.id} className={i > index ? 'inactive-step' : undefined}>
          <span
            className="step-mark text-[15px]"
            style={i === index ? { borderColor: 'var(--brand)', color: 'var(--brand)' } : undefined}
          >
            {i + 1}
          </span>
          <span className={`block min-w-[80px] text-[14px] ${i === index ? 'font-semibold text-store-dark' : 'text-store-dark'}`}>
            {STEP_LABELS[s.id] ?? s.name}
          </span>
        </li>
      ))}
    </ol>
  );
}

export function Checkout() {
  const {
    customer, refreshCart, entities, content,
  } = useProduct();
  const navigate = useNavigate();
  const [state, setState] = useState(null);
  const [step, setStep] = useState('billing');
  const [address, setAddress] = useState({
    firstName: '', lastName: '', addressLine1: '', city: '', county: '', country: '', zip: '', phone: '', email: '', landmark: '',
  });
  const [method, setMethod] = useState(null);
  const [phone, setPhone] = useState('');
  const [slot, setSlot] = useState('');
  const [slots, setSlots] = useState([]);
  const [terms, setTerms] = useState(false);
  const [acknowledged, setAcknowledged] = useState(false);
  const [totals, setTotals] = useState(null);
  const [failures, setFailures] = useState([]);
  const [placing, setPlacing] = useState(false);
  const [pending, setPending] = useState(null);

  useEffect(() => {
    api.get('/checkout-area/checkout').then((s) => {
      setState(s);
      setStep(s.steps[0]?.id ?? 'confirm');
      if (s.paymentMethods[0]) setMethod(s.paymentMethods[0].systemName);
    }).catch(() => {});
    api.get('/logistics/delivery-slots').then(setSlots).catch(() => {});
  }, [content?.clientName]);

  useEffect(() => {
    if (customer) {
      setAddress((a) => ({
        ...a,
        firstName: a.firstName || customer.firstName || '',
        lastName: a.lastName || customer.lastName || '',
        email: a.email || customer.email || '',
        phone: a.phone || customer.phone || '',
        ...(customer.addresses?.[0] ?? {}),
      }));
      setPhone((p) => p || customer.phone || '');
    }
  }, [customer]);

  useEffect(() => {
    if (!method) return;
    api.get(`/checkout-area/checkout/totals?paymentMethodSystemName=${method}`).then(setTotals).catch(() => {});
  }, [method, step]);

  if (!state) return <Spinner />;

  if (state.signInRequired) {
    return (
      <div className="max-w-xl mx-auto space-y-4">
        <h1 className="nop-page-title">Sign in to continue</h1>
        <Alert tone="warning" title="This store requires an account before payment">
          Guests may browse and fill a cart, but no order or payment can be made by a guest.
</Alert>
        <div className="flex gap-2">
          <Button as="link" to="/login" variant="brand">Log in or register</Button>
          <Button as="link" to="/cart">Back to cart</Button>
        </div>
      </div>
    );
  }

  const currency = totals?.currency ?? 'USD';
  const selected = state.paymentMethods.find((m) => m.systemName === method);
  const stepIds = state.steps.map((s) => s.id);
  const goNext = () => {
    const i = stepIds.indexOf(step);
    setStep(stepIds[Math.min(i + 1, stepIds.length - 1)]);
  };
  const goBack = () => {
    const i = stepIds.indexOf(step);
    setStep(stepIds[Math.max(i - 1, 0)]);
  };

  const confirm = async () => {
    setPlacing(true);
    setFailures([]);
    try {
      const res = await api.post('/checkout-area/checkout/confirm', {
        paymentMethodSystemName: method,
        termsAccepted: terms,
        shownTotal: totals?.total,
        paymentData: { phone },
        billingAddress: address,
        shippingAddress: address,
        deliverySlotId: slot ? Number(slot) : null,
      });
      if (!res.ok) {
        setFailures(res.failures ?? [{ message: 'Placement failed.' }]);
        return;
      }
      await refreshCart();
      if (res.payment?.status === 'Pending' && res.payment?.customerAction) {
        setPending(res);
        return;
      }
      navigate('/order-completed', { state: res });
    } finally {
      setPlacing(false);
    }
  };

  const respondToPush = async (accept) => {
    const cb = await api.post('/payments/callback', { providerRef: pending.payment.providerRef, accept });
    if (accept && cb.status === 'Paid') navigate('/order-completed', { state: { ...pending, payment: { ...pending.payment, status: 'Paid' } } });
    else setFailures([{ message: `${selected?.name}: ${cb.reason ?? 'the payment was not completed'}. The orders stay unpaid and can be retried (paymentsettings.allowrepostingpayments).` }]);
    setPending(null);
  };

  if (pending) {
    return (
      <div className="max-w-lg mx-auto space-y-4">
        <h1 className="nop-page-title">Confirm the payment on your phone</h1>
        <Panel title={selected?.name}>
          <p className="text-[13px]">{pending.payment.customerAction}</p>
          <dl className="mt-3 text-[13px] space-y-1">
            <div className="flex justify-between"><dt className="text-nop-muted">Amount</dt><dd className="font-medium">{money(pending.totals.total, currency)}</dd></div>
            <div className="flex justify-between"><dt className="text-nop-muted">Reference</dt><dd className="font-mono text-[12px]">{pending.checkoutReference}</dd></div>
            <div className="flex justify-between"><dt className="text-nop-muted">Provider reference</dt><dd className="font-mono text-[12px]">{pending.payment.providerRef}</dd></div>
          </dl>
          <div className="mt-4 flex gap-2">
            <Button variant="success" onClick={() => respondToPush(true)}>Enter PIN and confirm</Button>
            <Button variant="danger" onClick={() => respondToPush(false)}>Cancel on handset</Button>
          </div>
</Panel>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h1 className="nop-page-title">Checkout</h1>
      <CheckoutProgress steps={state.steps} current={step} />

      {failures.length > 0 && (
        <Alert tone="error" title="The order was not placed">
          <ul className="list-disc pl-5 space-y-0.5">
            {failures.map((f, i) => <li key={i}>{f.message}{f.newTotal ? ` New total: ${money(f.newTotal, currency)}.` : ''}</li>)}
          </ul>
        </Alert>
      )}

      <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
        <div className="space-y-4">
          {(step === 'billing' || step === 'shipping') && (
            <Panel title={STEP_LABELS[step]}>
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="First name" required><Input value={address.firstName} onChange={(e) => setAddress({ ...address, firstName: e.target.value })} /></Field>
                <Field label="Last name" required><Input value={address.lastName} onChange={(e) => setAddress({ ...address, lastName: e.target.value })} /></Field>
                <Field label="E-mail" required={!customer}><Input type="email" value={address.email} onChange={(e) => setAddress({ ...address, email: e.target.value })} /></Field>
                <Field label="Phone"><Input value={address.phone} onChange={(e) => setAddress({ ...address, phone: e.target.value })} /></Field>
                <Field label="Street address" hint="CHK-007: a street address, a landmark or a map pin is enough"><Input value={address.addressLine1} onChange={(e) => setAddress({ ...address, addressLine1: e.target.value })} /></Field>
                <Field label="Landmark" hint="Address attribute (REQ-MPC-FR-113)"><Input value={address.landmark} onChange={(e) => setAddress({ ...address, landmark: e.target.value })} /></Field>
                <Field label="City / town" required><Input value={address.city} onChange={(e) => setAddress({ ...address, city: e.target.value })} /></Field>
                <Field label="County / district">
                  <Select value={address.county} onChange={(e) => setAddress({ ...address, county: e.target.value })}>
                    <option value="">Choose…</option>
                    {(entities.statesProvinces ?? []).map((s) => <option key={s} value={s}>{s}</option>)}
                  </Select>
                </Field>
              </div>
</Panel>
          )}

          {step === 'shipping-method' && (
            <Panel title="Shipping method">
              <p className="text-[13px] text-nop-muted mb-3">
                Each cart line already carries its own choice of home delivery or collection (CHK-005). The fee is
                calculated per seller group.
              </p>
              <div className="space-y-2">
                {(totals?.perSeller ?? []).map((g) => (
                  <div key={g.key} className="border border-nop-border rounded-sm p-3">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <div className="font-medium text-[13px]">{g.vendorName}</div>
                        <div className="text-[12px] text-nop-muted">
                          {g.fulfilment === 'pickup' ? 'Collection at an outlet' : 'Home delivery'} · {g.lines} line{g.lines === 1 ? '' : 's'} · {g.weightKg.toFixed(2)} kg
                        </div>
                      </div>
                      <div className="font-medium">{money(g.fee, currency)}</div>
                    </div>
                    <p className="text-[11.5px] text-nop-muted mt-1.5">{g.basis}</p>
                  </div>
                ))}
              </div>
              {state.deliveryDate.enabled && slots.length > 0 && (
                <div className="mt-4 max-w-sm">
                  <Field label="Delivery window" hint={`CHK-006; capacity is reserved at placement under the lock chk-slot-{SlotId}-{Date}`}>
                    <Select value={slot} onChange={(e) => setSlot(e.target.value)}>
                      <option value="">No preference</option>
                      {slots.map((s) => <option key={s.id} value={s.id}>{s.name} (capacity {s.capacity})</option>)}
                    </Select>
                  </Field>
                </div>
              )}
            </Panel>
          )}

          {step === 'payment-method' && (
            <Panel title="Payment method">
              <div className="space-y-2">
                {state.paymentMethods.map((m) => (
                  <label key={m.systemName} className={`flex items-start gap-3 border rounded-sm p-3 cursor-pointer ${method === m.systemName ? 'border-nop-blue bg-sky-50/40' : 'border-nop-border'}`}>
                    <input type="radio" name="payment" checked={method === m.systemName} onChange={() => setMethod(m.systemName)} className="mt-0.5 size-4" />
                    <span className="min-w-0">
                      <span className="font-medium text-[13px] block">{m.name}</span>
                      <span className="text-[12px] text-nop-muted">
                        {m.kind} · {m.feature}
                        {m.additionalFee > 0 ? ` · additional fee ${money(m.additionalFee, currency)}` : ''}
                        {m.supportsGroupPayment ? ' · supports one payment for several sellers' : ''}
                      </span>
                    </span>
                  </label>
                ))}
              </div>
              {state.paymentMethodsExcluded.length > 0 && (
                <div className="mt-3">
                  <Alert tone="info" title="Methods not offered for this cart">
                    <ul className="space-y-1">
                      {state.paymentMethodsExcluded.map((m) => (
                        <li key={m.systemName}><span className="font-medium">{m.name}</span> - {m.citation}</li>
                      ))}
                    </ul>
                  </Alert>
                </div>
              )}
</Panel>
          )}

          {step === 'payment-info' && (
            <Panel title="Payment information">
              {selected?.requiresPhone ? (
                <div className="max-w-sm">
                  <Field label="Mobile money number" required hint="The push request is sent to this number">
                    <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="2547XXXXXXXX" />
                  </Field>
                </div>
              ) : selected?.offlineAtCounter ? (
                <Alert tone="info">
                  You will be given a secure reference and pay at the counter. The order waits until the payment is
                  confirmed.
                </Alert>
              ) : (
                <Alert tone="info">
                  Your card details are entered on the payment provider's own page. We never see or store them.
                </Alert>
              )}
            </Panel>
          )}

          {step === 'confirm' && (
            <Panel title="Confirm order">
              <div className="space-y-3">
                <div className="border border-nop-border rounded-sm divide-y divide-gray-100">
                  {(state.cart.items ?? []).map((item) => (
                    <div key={item.id} className="flex items-center gap-3 p-3">
                      <div className="w-10"><ProductPicture picture={item.product.picture} name={item.product.name} size="sm" /></div>
                      <div className="flex-1 min-w-0">
                        <div className="text-[13px] font-medium truncate">{item.product.name}</div>
                        <div className="text-[12px] text-nop-muted">
                          {item.quantity} × {money(item.unitPrice, currency)} · {item.product.vendor?.name} · {item.fulfilment === 'pickup' ? 'collection' : 'delivery'}
                        </div>
                      </div>
                      <div className="text-[13px] font-medium">{money(item.subtotal, currency)}</div>
                    </div>
                  ))}
                </div>

                <Checkbox
                  label="I have read the returns and refund policy"
                  checked={acknowledged}
                  onChange={(e) => setAcknowledged(e.target.checked)}
                  hint="CHK-009 e-transactions consumer controls; the notice set comes from the country law profile."
                />
                {state.termsRequired && (
                  <Checkbox
                    label="I agree with the terms of service"
                    checked={terms}
                    onChange={(e) => setTerms(e.target.checked)}
                    hint="You must accept the terms before the order can be placed."
                  />
                )}
                <Button
                  variant="brand"
                  size="lg"
                  onClick={confirm}
                  disabled={placing || !acknowledged || (state.termsRequired && !terms)}
                >
                  {placing ? 'Placing the order…' : 'Confirm order'}
                </Button>
              </div>
            </Panel>
          )}

          <div className="flex items-center gap-2">
            {stepIds.indexOf(step) > 0 && <Button onClick={goBack}>Back</Button>}
            {step !== 'confirm' && <Button variant="primary" onClick={goNext}>Continue</Button>}
            <Button as="link" to="/cart" className="ml-auto">Back to cart</Button>
          </div>
        </div>

        <aside className="space-y-3">
          <Panel title="Order summary" bodyClass="p-3 bg-store-totals">
            {!totals ? <Spinner label="Calculating" /> : (
              <>
                <Row label="Sub-total" value={money(totals.subtotal, currency)} />
                <Row label="Delivery / pickup" value={money(totals.deliveryFee, currency)} />
                {totals.paymentFee > 0 && <Row label="Payment fee" value={money(totals.paymentFee, currency)} />}
                <Row label={`Tax (${(totals.taxRate * 100).toFixed(0)}%)`} value={money(totals.tax, currency)} />
                <div className="border-t border-nop-border mt-2 pt-2">
                  <Row label="Total" value={money(totals.total, currency)} strong />
                </div>
</>
            )}
          </Panel>
          {state.cart.multiSeller && (
            <Panel title="This checkout will split" bodyClass="p-3">
              <ul className="text-[12.5px] space-y-1">
                {(totals?.perSeller ?? []).map((g) => (
                  <li key={g.key} className="flex justify-between gap-2">
                    <span className="text-nop-muted truncate">{g.vendorName} · {g.fulfilment}</span>
                    <span>{money(g.subtotal + g.fee, currency)}</span>
                  </li>
                ))}
              </ul>
</Panel>
          )}
        </aside>
      </div>
    </div>
  );
}

function Row({ label, value, strong }) {
  return (
    <div className={`flex justify-between py-1 ${strong ? 'text-[20px] brand-text' : 'text-[13px]'}`}>
      <span className={strong ? 'text-store-dark text-[15px] self-center' : 'text-nop-muted'}>{label}</span>
      <span>{value}</span>
    </div>
  );
}

/* ---------------------------------------------------------- order completed --- */

export function OrderCompleted() {
  const [result, setResult] = useState(null);
  useEffect(() => {
    const state = window.history.state?.usr;
    if (state) setResult(state);
  }, []);

  if (!result) {
    return (
      <div className="max-w-xl mx-auto space-y-3">
        <h1 className="nop-page-title">Thank you</h1>
        <Alert tone="info">
          Your order has been placed. Open <Link to="/account/orders" className="underline">My account - Orders</Link> to see it.
        </Alert>
      </div>
    );
  }

  const currency = result.totals?.currency ?? 'USD';
  return (
    <div className="max-w-3xl mx-auto space-y-4">
      <h1 className="nop-page-title">Your order has been placed</h1>
      <Alert tone="success" title={result.confirmation}>
        Checkout reference <span className="font-mono">{result.checkoutReference}</span>
        {result.split ? ` · ${result.orders.length} sub-orders` : ''}
      </Alert>

      <Panel title="Orders" subtitle="CHK-019 confirmation; CHK-004 one sub-order per seller and fulfilment choice">
        <ul className="divide-y divide-gray-100">
          {result.orders.map((o) => (
            <li key={o.orderNumber} className="py-3 flex flex-wrap items-center gap-3">
              <Link to={`/account/orders/${o.orderNumber}`} className="font-mono text-[13px] brand-text hover:underline">{o.orderNumber}</Link>
              <span className="text-[13px]">{o.vendorName}</span>
              <Badge tone={o.fulfilment === 'pickup' ? 'amber' : 'blue'}>{o.fulfilment === 'pickup' ? 'Collection' : 'Delivery'}</Badge>
              <span className="ml-auto font-medium">{money(o.total, currency)}</span>
              {o.pickupCode && (
                <div className="w-full mt-1 bg-amber-50 border border-amber-200 rounded-sm px-3 py-2">
                  <div className="text-[12px] text-amber-900">Pickup code for this sub-order</div>
                  <div className="font-mono text-[20px] tracking-widest text-amber-950">{o.pickupCode}</div>
                  <div className="text-[11.5px] text-amber-900 mt-0.5">
                    Single use, and valid only at the outlet shown. We have also sent it to you by SMS.
                  </div>
                </div>
              )}
            </li>
          ))}
        </ul>
      </Panel>

      <div className="flex gap-2">
        <Button as="link" to="/account/orders" variant="brand">My orders</Button>
        <Button as="link" to="/">Continue shopping</Button>
      </div>
    </div>
  );
}
