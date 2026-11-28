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
  Alert, Badge, Button, Checkbox, Field, Input, Panel, ProductPicture, Select, Spinner, Textarea,
} from '../../ui/nop/kit.jsx';

/* --------------------------------------------------------------------- cart --- */

export function Cart() {
  const { cart, refreshCart, settings } = useProduct();
  const navigate = useNavigate();
  const [warnings, setWarnings] = useState([]);
  const [points, setPoints] = useState([]);
  const [thresholds, setThresholds] = useState(null);
  const [terms, setTerms] = useState(false);
  const termsOnCart = settings('ordersettings.termsofserviceonshoppingcartpage', false);
  const allowSaveForLater = settings('shoppingcartsettings.allowmultiplewishlist', false);

  useEffect(() => { api.get('/logistics/pickup-points').then(setPoints).catch(() => {}); }, []);
  useEffect(() => { refreshCart(); }, [refreshCart]);
  // the store's minimum order value, if it sets one (CHK-010)
  useEffect(() => { api.get('/checkout-area/thresholds').then(setThresholds).catch(() => {}); }, [cart?.subtotal]);

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
      {thresholds?.refused && (
        <Alert tone="warning" title="Your cart is below the smallest order this shop takes">
          {thresholds.warnings.map((w) => <div key={w.key}>{w.message}</div>)}
        </Alert>
      )}

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
                    <td className="px-3 py-3 text-right font-medium">
                      {money(item.subtotal, currency)}
                      {item.discountAmount > 0 && (
                        <div className="text-[11.5px] font-normal text-green-700">
                          including a discount of {money(item.discountAmount, currency)}
                        </div>
                      )}
                    </td>
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
              <Panel title="Estimate shipping">
                <p className="text-[13px] text-nop-muted">
                  Delivery and collection fees are calculated for each seller and shown at checkout.
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
                  disabled={(termsOnCart && !terms) || thresholds?.refused === true}
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

function CheckoutProgress({ indicator }) {
  return (
    <ol className="nop-order-progress flex flex-wrap items-start justify-center gap-x-6 gap-y-3">
      {indicator.map((s, i) => (
        <li
          key={s.id}
          className={s.state === 'todo' ? 'inactive-step' : undefined}
          aria-current={s.state === 'current' ? 'step' : undefined}
        >
          <span
            className="step-mark text-[15px]"
            style={s.state === 'current' ? { borderColor: 'var(--brand)', color: 'var(--brand)' } : undefined}
          >
            {s.state === 'done' ? '\u2713' : i + 1}
          </span>
          <span className={`block min-w-[80px] text-[14px] ${s.state === 'current' ? 'font-semibold text-store-dark' : 'text-store-dark'}`}>
            {STEP_LABELS[s.id] ?? s.name}
          </span>
          <span className="sr-only">{s.state === 'done' ? ' (completed)' : ''}</span>
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
  const [progress, setProgress] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});
  const [stepMessage, setStepMessage] = useState(null);
  const [required, setRequired] = useState({});
  const [summary, setSummary] = useState(null);
  const [chosenAddressId, setChosenAddressId] = useState('');
  const [countries, setCountries] = useState([]);
  const [shippingStep, setShippingStep] = useState(null);
  const [lineErrors, setLineErrors] = useState([]);
  const [instructions, setInstructions] = useState('');
  const [addressForm, setAddressForm] = useState(null);
  const [attributes, setAttributes] = useState({});
  const [pin, setPin] = useState(null);
  const [notices, setNotices] = useState([]);
  const [mustAcknowledge, setMustAcknowledge] = useState([]);
  const [ticked, setTicked] = useState({});
  const [pickupMethods, setPickupMethods] = useState(null);
  const [pickupMethod, setPickupMethod] = useState(null);
  const [extraFields, setExtraFields] = useState([]);
  const [extraValues, setExtraValues] = useState({});

  const loadProgress = React.useCallback(async () => {
    const next = await api.get('/checkout-area/checkout/steps');
    setProgress(next);
    return next;
  }, []);

  useEffect(() => {
    api.get('/checkout-area/checkout').then((s) => {
      setState(s);
      setStep(s.steps[0]?.id ?? 'confirm');
      if (s.paymentMethods[0]) setMethod(s.paymentMethods[0].systemName);
    }).catch(() => {});
    api.get('/checkout-area/delivery-windows').then((w) => setSlots(w.windows ?? [])).catch(() => {});
    api.get('/checkout-area/checkout/step-fields').then(setRequired).catch(() => {});
    api.get('/platform/countries').then(setCountries).catch(() => {});
    loadProgress().catch(() => {});
  }, [content?.clientName, loadProgress]);

  // the address the account keeps as its default is pre-selected on the two address steps
  useEffect(() => {
    if (!progress?.defaultAddress || chosenAddressId) return;
    const a = progress.defaultAddress;
    setChosenAddressId(String(a.id));
    setAddress((current) => ({ ...current, ...a }));
  }, [progress?.defaultAddress, chosenAddressId]);

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

  const loadShippingStep = React.useCallback(async (date = null) => {
    const query = date ? `?date=${encodeURIComponent(date)}` : '';
    const next = await api.get(`/checkout-area/checkout/shipping-step${query}`);
    setShippingStep(next);
    setInstructions((current) => current || next.instructions?.value || '');
    return next;
  }, []);

  useEffect(() => {
    if (step !== 'shipping-method') return;
    loadShippingStep(slot ? null : null).catch(() => {});
  }, [step, loadShippingStep]);

  // the address form of the chosen country: the county fields, the attributes and the map pin
  useEffect(() => {
    if (step !== 'billing' && step !== 'shipping') return;
    const query = address.country ? `?country=${encodeURIComponent(address.country)}` : '';
    api.get(`/checkout-area/address/form${query}`).then(setAddressForm).catch(() => {});
  }, [step, address.country]);

  useEffect(() => {
    if (step !== 'confirm' || !method) return;
    api.get(`/checkout-area/checkout/confirm-summary?paymentMethodSystemName=${method}`).then(setSummary).catch(() => {});
  }, [step, method]);

  useEffect(() => {
    if (step !== 'confirm' || !method) return;
    api.get(`/checkout-area/checkout/totals?paymentMethodSystemName=${method}`).then(setTotals).catch(() => {});
  }, [JSON.stringify(extraValues)]);

  // the notices this country asks for at this point of checkout, and what must be ticked
  useEffect(() => {
    api.get(`/checkout-area/notices/${step}`).then((n) => setNotices(n.notices ?? [])).catch(() => setNotices([]));
    if (step !== 'confirm') return;
    api.get('/checkout-area/checkout/acknowledgements')
      .then((a) => setMustAcknowledge(a.required ?? []))
      .catch(() => setMustAcknowledge([]));
    api.get('/checkout-area/pickup-code/methods').then((m) => {
      setPickupMethods(m);
      setPickupMethod((current) => current ?? m.defaultMethod ?? null);
    }).catch(() => {});
  }, [step]);

  // the fields this shop asks for at checkout, and whether one depends on another
  useEffect(() => {
    if (step !== 'confirm') return;
    const query = new URLSearchParams(Object.entries(extraValues).map(([k, v]) => [k, String(v)]));
    api.get(`/checkout-area/checkout-attributes?${query.toString()}`)
      .then((a) => setExtraFields(a.attributes ?? []))
      .catch(() => setExtraFields([]));
  }, [step, JSON.stringify(extraValues)]);

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
  const indicator = progress?.progressIndicator
    ?? state.steps.map((s) => ({ id: s.id, name: s.name, state: s.id === step ? 'current' : 'todo' }));
  const isRequired = (field) => (required[step] ?? []).includes(field);

  // every step is checked on the server; a failure shows the step again with what was entered
  // kept and a message against each field that failed
  const goNext = async () => {
    const values = {
      billing: { ...address, attributes, pin },
      shipping: { ...address, attributes, pin },
      'shipping-method': {
        fulfilment: 'per line',
        lines: (shippingStep?.lines ?? []).map((l) => ({
          itemId: l.shoppingCartItemId,
          method: l.chosen.method,
          pickupPointId: l.chosen.pickupPointId,
        })),
        shippingMethod: shippingStep?.shippingMethod ?? null,
        desiredDeliveryDate: shippingStep?.chosenDate ?? null,
        deliverySlotId: slot || null,
        area: address.city || null,
        ...(shippingStep?.instructions ? { instructions } : {}),
      },
      'payment-method': { paymentMethodSystemName: method },
      'payment-info': {},
    }[step] ?? {};
    const res = await api.post(`/checkout-area/checkout/steps/${step}`, {
      antiforgeryToken: 'prototype-antiforgery-token',
      values,
    });
    if (res.ok !== true) {
      setFieldErrors(res.fieldErrors ?? {});
      setLineErrors(res.lineErrors ?? []);
      setStepMessage(res.message ?? null);
      if (res.progressIndicator) setProgress((p) => ({ ...(p ?? {}), progressIndicator: res.progressIndicator }));
      return;
    }
    setFieldErrors({});
    setLineErrors([]);
    setStepMessage(null);
    const next = await loadProgress();
    setStep(res.nextStep ?? next.currentStep ?? stepIds[Math.min(stepIds.indexOf(step) + 1, stepIds.length - 1)]);
  };
  const goBack = () => {
    const i = stepIds.indexOf(step);
    setFieldErrors({});
    setStepMessage(null);
    setStep(stepIds[Math.max(i - 1, 0)]);
  };

  const confirm = async () => {
    setPlacing(true);
    setFailures([]);
    try {
      const res = await api.post('/checkout-area/checkout/confirm', {
        paymentMethodSystemName: method,
        termsAccepted: terms,
        acknowledgements: Object.entries(ticked).filter(([, v]) => v).map(([k]) => k),
        checkoutAttributes: extraValues,
        pickupIdentification: pickupMethod,
        shownTotal: summary?.total ?? totals?.total,
        paymentData: { phone },
        billingAddress: address,
        shippingAddress: address,
        deliverySlotId: slot ? Number(slot) : null,
      });
      if (!res.ok) {
        setFailures(res.failures ?? [{ message: 'Placement failed.' }]);
        if (res.messageKey === 'Chk.PriceChanged') {
          const fresh = await api.get(`/checkout-area/checkout/confirm-summary?paymentMethodSystemName=${method}`);
          setSummary(fresh);
          setTotals(await api.get(`/checkout-area/checkout/totals?paymentMethodSystemName=${method}`));
        }
        if (res.failures?.[0]?.step && res.failures[0].step !== 'confirm') setStep(res.failures[0].step);
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
      <CheckoutProgress indicator={indicator} />

      {notices.length > 0 && (
        <div className="space-y-2">
          {notices.map((n) => (
            <Alert key={n.topicSystemName} tone="info" title={n.title}>
              {n.body}
              {n.version ? <span className="block text-[11.5px] mt-1">Version {n.version}.</span> : null}
            </Alert>
          ))}
        </div>
      )}

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
              {(progress?.addressBook ?? []).length > 0 && (
                <div className="mb-3 max-w-md">
                  <Field label="Use an address you have saved">
                    <Select
                      value={chosenAddressId}
                      onChange={(e) => {
                        setChosenAddressId(e.target.value);
                        const picked = (progress.addressBook ?? []).find((a) => String(a.id) === e.target.value);
                        if (picked) setAddress((current) => ({ ...current, ...picked }));
                      }}
                    >
                      <option value="">Enter a new address</option>
                      {(progress.addressBook ?? []).map((a) => (
                        <option key={a.id} value={a.id}>
                          {[a.addressLine1, a.city, a.country].filter(Boolean).join(', ')}
                          {String(a.id) === String(progress.defaultAddress?.id) ? ' (your default)' : ''}
                        </option>
                      ))}
                    </Select>
                  </Field>
                </div>
              )}
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="First name" required={isRequired('firstName')} error={fieldErrors.firstName}><Input value={address.firstName} onChange={(e) => setAddress({ ...address, firstName: e.target.value })} /></Field>
                <Field label="Last name" required={isRequired('lastName')} error={fieldErrors.lastName}><Input value={address.lastName} onChange={(e) => setAddress({ ...address, lastName: e.target.value })} /></Field>
                <Field label="E-mail" required={!customer} error={fieldErrors.email}><Input type="email" value={address.email} onChange={(e) => setAddress({ ...address, email: e.target.value })} /></Field>
                <Field label="Phone" required={isRequired('phone')} error={fieldErrors.phone}><Input value={address.phone} onChange={(e) => setAddress({ ...address, phone: e.target.value })} /></Field>
                <Field label="Street address" required={isRequired('addressLine1')} error={fieldErrors.addressLine1} hint="A street address, a landmark or a map pin is enough"><Input value={address.addressLine1} onChange={(e) => setAddress({ ...address, addressLine1: e.target.value })} /></Field>
                <Field
                  label="Landmark"
                  required={(addressForm?.attributes ?? []).find((a) => a.name === 'Landmark')?.isRequired === true}
                  error={fieldErrors.Landmark}
                  hint="Nearest landmark, to help the courier find you"
                >
                  <Input
                    value={attributes.Landmark ?? address.landmark ?? ''}
                    onChange={(e) => {
                      setAttributes({ ...attributes, Landmark: e.target.value });
                      setAddress({ ...address, landmark: e.target.value });
                    }}
                  />
                </Field>
                <Field label="City / town" required={isRequired('city')} error={fieldErrors.city}><Input value={address.city} onChange={(e) => setAddress({ ...address, city: e.target.value })} /></Field>
                <Field label="Country" required={isRequired('country')} error={fieldErrors.country}>
                  <Select value={address.country} onChange={(e) => setAddress({ ...address, country: e.target.value })}>
                    <option value="">Choose…</option>
                    {countries
                      .filter((c) => c.published !== false && (step === 'shipping' ? c.allowsShipping !== false : c.allowsBilling !== false))
                      .map((c) => <option key={c.id ?? c.name} value={c.name}>{c.name}</option>)}
                  </Select>
                </Field>
                {addressForm?.county.enabled !== false && (
                  <Field
                    label="County / district"
                    required={addressForm?.county.required === true}
                    error={fieldErrors.county}
                  >
                    <Select value={address.county} onChange={(e) => setAddress({ ...address, county: e.target.value })}>
                      <option value="">Choose…</option>
                      {(addressForm?.statesProvinces?.length ? addressForm.statesProvinces : (entities.statesProvinces ?? []))
                        .map((sp) => <option key={sp} value={sp}>{sp}</option>)}
                    </Select>
                  </Field>
                )}
                {/* the address attributes this store asks for: landmark, a name for the address,
                    a post-office box */}
                {(addressForm?.attributes ?? []).filter((a) => a.name !== 'Landmark').map((attribute) => (
                  <Field
                    key={attribute.id}
                    label={attribute.name}
                    required={attribute.isRequired}
                    error={fieldErrors[attribute.name]}
                  >
                    <Input
                      value={attributes[attribute.name] ?? ''}
                      maxLength={attribute.maxLength ?? undefined}
                      onChange={(e) => setAttributes({ ...attributes, [attribute.name]: e.target.value })}
                    />
                  </Field>
                ))}
              </div>

              {addressForm?.mapPinEnabled && (
                <div className="mt-3 border border-nop-border rounded-sm p-3">
                  <div className="text-[12.5px] font-medium text-gray-700">Put a pin on the map</div>
                  <p className="text-[11.5px] text-nop-muted mt-0.5">
                    If your home is hard to describe, drop a pin and the courier will use it.
                  </p>
                  <div className="mt-2 grid gap-2 sm:grid-cols-3">
                    <Field label="Latitude">
                      <Input
                        value={pin?.latitude ?? ''}
                        onChange={(e) => setPin({ ...(pin ?? {}), latitude: e.target.value })}
                        placeholder="-13.9626"
                      />
                    </Field>
                    <Field label="Longitude">
                      <Input
                        value={pin?.longitude ?? ''}
                        onChange={(e) => setPin({ ...(pin ?? {}), longitude: e.target.value })}
                        placeholder="33.7741"
                      />
                    </Field>
                    <div className="self-end">
                      <Button
                        size="sm"
                        onClick={() => {
                          if (!navigator.geolocation) return;
                          navigator.geolocation.getCurrentPosition((position) => setPin({
                            latitude: position.coords.latitude.toFixed(6),
                            longitude: position.coords.longitude.toFixed(6),
                          }));
                        }}
                      >
                        Use where I am now
                      </Button>
                    </div>
                  </div>
                  {pin?.latitude && pin?.longitude && (
                    <p className="text-[11.5px] text-nop-muted mt-1.5">
                      Pin at {pin.latitude}, {pin.longitude}.
                    </p>
                  )}
                </div>
              )}

              {(addressForm?.locatorRule ?? []).length > 0 && (
                <p className="mt-2 text-[11.5px] text-nop-muted">
                  Give at least one of: {addressForm.locatorRule.map((l) => ({ street: 'a street address', landmark: 'a landmark', pin: 'a pin on the map' }[l] ?? l)).join(', ')}.
                </p>
              )}
              {stepMessage && <Alert tone="error" className="mt-3">{stepMessage}</Alert>}
              {Object.keys(fieldErrors).length > 0 && (
                <p className="mt-3 text-[12.5px] text-red-700">
                  Please correct the fields marked above. What you have already entered has been kept.
                </p>
              )}
</Panel>
          )}

          {step === 'shipping-method' && (
            <Panel title="Shipping method">
              {!shippingStep ? <Spinner label="Loading your delivery choices" /> : (
                <div className="space-y-5">
                  {lineErrors.length > 0 && (
                    <Alert tone="error">
                      <ul className="list-disc pl-5 space-y-0.5">
                        {lineErrors.map((e, i) => <li key={i}>{e.message}</li>)}
                      </ul>
                    </Alert>
                  )}

                  {/* the choice of each item: delivered, or collected at an outlet */}
                  <div className="space-y-3">
                    {shippingStep.lines.map((line) => (
                      <div key={line.shoppingCartItemId} className="border border-nop-border rounded-sm p-3">
                        <div className="font-medium text-[13px]">{line.productName}</div>
                        <div className="mt-2 grid gap-2 sm:grid-cols-2">
                          <Field label="How would you like this item?">
                            <Select
                              value={line.chosen.method}
                              aria-label={`Fulfilment for ${line.productName}`}
                              onChange={async (e) => {
                                await api.post(`/checkout-area/fulfilment/lines/${line.shoppingCartItemId}`, {
                                  method: e.target.value,
                                  pickupPointId: e.target.value === 'pickup'
                                    ? (line.chosen.pickupPointId ?? line.preferredPickupPointId ?? line.outlets[0]?.id ?? null)
                                    : null,
                                });
                                await loadShippingStep(shippingStep.chosenDate);
                                await refreshCart();
                              }}
                            >
                              {line.methods.map((m) => (
                                <option key={m.id} value={m.id} disabled={!m.offered}>{m.name}</option>
                              ))}
                            </Select>
                          </Field>
                          {line.chosen.method === 'pickup' && (
                            <Field label="Collect from" hint={line.preferredPickupPointId ? 'Your usual outlet is chosen for you' : null}>
                              <Select
                                value={line.chosen.pickupPointId ?? ''}
                                aria-label={`Outlet for ${line.productName}`}
                                onChange={async (e) => {
                                  await api.post(`/checkout-area/fulfilment/lines/${line.shoppingCartItemId}`, {
                                    method: 'pickup', pickupPointId: Number(e.target.value),
                                  });
                                  await loadShippingStep(shippingStep.chosenDate);
                                  await refreshCart();
                                }}
                              >
                                <option value="">Choose an outlet…</option>
                                {line.outlets.map((o) => <option key={o.id} value={o.id}>{o.name} - {o.city}</option>)}
                              </Select>
                            </Field>
                          )}
                        </div>
                        {line.methods.filter((m) => !m.offered && m.reason).map((m) => (
                          <p key={m.id} className="text-[11.5px] text-amber-800 mt-1.5">{m.name}: {m.reason}</p>
                        ))}
                        {line.outletsNotOffered.length > 0 && line.chosen.method === 'pickup' && (
                          <p className="text-[11.5px] text-nop-muted mt-1.5">
                            {line.outletsNotOffered.map((o) => `${o.name} - ${o.reason}`).join('; ')}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* what each delivery option and each outlet would mean */}
                  {(shippingStep.estimates.options.some((o) => o.earliest) || shippingStep.estimates.outlets.length > 0) && (
                    <div className="space-y-2">
                      <h3 className="text-[13px] font-semibold text-store-dark">When to expect your order</h3>
                      {shippingStep.estimates.options.filter((o) => o.earliest).map((o) => (
                        <div key={o.shippingMethod} className="flex items-center justify-between gap-3 border border-nop-border rounded-sm px-3 py-2">
                          <span className="text-[13px] font-medium">{o.shippingMethod}</span>
                          <span className="text-[12.5px] text-nop-muted">{o.message}</span>
                        </div>
                      ))}
                      {shippingStep.estimates.outlets.map((o) => (
                        <div key={o.pickupPointId} className="flex items-center justify-between gap-3 border border-nop-border rounded-sm px-3 py-2">
                          <span className="text-[13px] font-medium">{o.name}</span>
                          <span className="text-[12.5px] text-nop-muted">
                            {o.collectFrom ? `Ready to collect from ${o.collectFrom}` : 'The collection date is not available yet'}
                          </span>
                        </div>
                      ))}
                      {shippingStep.estimates.options.every((o) => !o.earliest) && shippingStep.estimates.outlets.length === 0 && (
                        <p className="text-[12.5px] text-nop-muted">No date is available for these options.</p>
                      )}
                    </div>
                  )}

                  {/* the fee of each seller and fulfilment group */}
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
                        <p className="text-[11.5px] text-nop-muted mt-1.5">{g.basisText ?? ''}</p>
                      </div>
                    ))}
                  </div>

                  {/* the preferred date and the windows of that date */}
                  {shippingStep.desiredDate.enabled && (
                    <div className="grid gap-3 sm:grid-cols-2">
                      <Field label={shippingStep.desiredDate.label} hint={shippingStep.desiredDate.note}>
                        <Select
                          value={shippingStep.chosenDate ?? ''}
                          onChange={async (e) => { await loadShippingStep(e.target.value || null); setSlot(''); }}
                        >
                          <option value="">No preference</option>
                          {shippingStep.desiredDate.dates.map((d) => <option key={d} value={d}>{d}</option>)}
                        </Select>
                      </Field>
                      {shippingStep.windowsOffered && (
                        <Field label="Delivery window" error={fieldErrors.deliverySlotId} hint="Your window is held when the order is placed">
                          <Select value={slot} onChange={(e) => setSlot(e.target.value)}>
                            <option value="">No preference</option>
                            {shippingStep.windows.map((w) => (
                              <option key={w.id} value={w.id}>{w.start}-{w.end} ({w.remaining} left)</option>
                            ))}
                          </Select>
                        </Field>
                      )}
                    </div>
                  )}
                  {shippingStep.desiredDate.enabled && shippingStep.chosenDate && !shippingStep.windowsOffered && (
                    <p className="text-[12.5px] text-nop-muted">No delivery window is offered for that date.</p>
                  )}

                  {/* the delivery instructions, where the store asks for them */}
                  {shippingStep.instructions && (
                    <Field
                      label={shippingStep.instructions.name}
                      required={shippingStep.instructions.isRequired}
                      error={fieldErrors.instructions}
                      hint="The courier reads this when they come to you"
                    >
                      <Textarea
                        rows={3}
                        maxLength={shippingStep.instructions.maxLength ?? undefined}
                        value={instructions}
                        onChange={(e) => setInstructions(e.target.value)}
                        placeholder="Blue gate opposite the school, ask for Amina"
                      />
                    </Field>
                  )}
                </div>
              )}
            </Panel>
          )}

          {step === 'payment-method' && (
            <Panel title="Payment method">
              {state.paymentMethodsNotice && (
                <Alert tone="error" title="We cannot take a payment for this order">
                  {state.paymentMethodsNotice.message}
                  {state.paymentMethodsNotice.supportContact?.value
                    && ` Please contact us on ${state.paymentMethodsNotice.supportContact.value}.`}
                </Alert>
              )}
              <div className="space-y-2">
                {state.paymentMethods.map((m) => (
                  <label key={m.systemName} className={`flex items-start gap-3 border rounded-sm p-3 cursor-pointer ${method === m.systemName ? 'border-nop-blue bg-sky-50/40' : 'border-nop-border'}`}>
                    <input type="radio" name="payment" checked={method === m.systemName} onChange={() => setMethod(m.systemName)} className="mt-0.5 size-4" />
                    <span className="min-w-0">
                      <span className="font-medium text-[13px] block">{m.name}</span>
                      <span className="text-[12px] text-nop-muted">
                        {m.kind}
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
                        <li key={m.systemName}><span className="font-medium">{m.name}</span> - {m.explanation ?? 'not available for this cart'}</li>
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
                  {(summary?.lines ?? []).map((line) => (
                    <div key={line.productId} className="flex items-center gap-3 p-3">
                      <div className="flex-1 min-w-0">
                        <div className="text-[13px] font-medium truncate">{line.name}</div>
                        <div className="text-[12px] text-nop-muted">
                          {line.quantity} × {money(line.unitPrice, summary.currency)} · {line.fulfilment === 'pickup' ? 'collection' : 'delivery'}
                        </div>
                      </div>
                      <div className="text-[13px] font-medium">{money(line.subtotal, summary.currency)}</div>
                    </div>
                  ))}
                  {!summary && <div className="p-3"><Spinner label="Calculating your order" /></div>}
                </div>

                {summary && (
                  <dl className="border border-nop-border rounded-sm p-3 bg-store-totals">
                    <Row label="Sub-total" value={money(summary.subtotal, summary.currency)} />
                    {summary.discount > 0 && <Row label="Discount" value={`- ${money(summary.discount, summary.currency)}`} />}
                    <Row label="Delivery / collection" value={money(summary.deliveryFee, summary.currency)} />
                    {summary.paymentFee > 0 && <Row label="Payment fee" value={money(summary.paymentFee, summary.currency)} />}
                    <Row label="Tax" value={money(summary.tax, summary.currency)} />
                    <div className="border-t border-nop-border mt-2 pt-2">
                      <Row label="Total to pay" value={money(summary.total, summary.currency)} strong />
                    </div>
                    <p className="mt-2 text-[11.5px] text-nop-muted">
                      Reference {summary.reference}. Nothing is charged until you confirm.
                    </p>
                  </dl>
                )}

                {mustAcknowledge.map((notice) => (
                  <Checkbox
                    key={notice.topicSystemName}
                    label={`I have read the ${String(notice.title ?? '').toLowerCase()}`}
                    checked={ticked[notice.topicSystemName] === true}
                    onChange={(e) => setTicked({ ...ticked, [notice.topicSystemName]: e.target.checked })}
                    hint="We keep a record of this with your order."
                  />
                ))}
                {mustAcknowledge.length === 0 && (
                  <Checkbox
                    label="I have read the returns and refund policy"
                    checked={acknowledged}
                    onChange={(e) => setAcknowledged(e.target.checked)}
                    hint="We keep a record of this acknowledgement with your order."
                  />
                )}
                {extraFields.filter((f) => f.shown).map((field) => (
                  <Field
                    key={field.id}
                    label={field.name}
                    required={field.isRequired}
                    error={fieldErrors[field.id]}
                  >
                    {field.values.length > 0 ? (
                      <Select
                        value={extraValues[field.id] ?? ''}
                        onChange={(e) => setExtraValues({ ...extraValues, [field.id]: e.target.value })}
                      >
                        <option value="">Choose…</option>
                        {field.values.map((v) => (
                          <option key={v.id} value={v.id}>
                            {v.name}{v.priceAdjustment > 0 ? ` (+${money(v.priceAdjustment, currency)})` : ''}
                          </option>
                        ))}
                      </Select>
                    ) : (
                      <Input
                        value={extraValues[field.id] ?? ''}
                        maxLength={field.validationMaxLength ?? undefined}
                        onChange={(e) => setExtraValues({ ...extraValues, [field.id]: e.target.value })}
                      />
                    )}
                  </Field>
                ))}

                {pickupMethods?.choiceOffered && (state.cart.items ?? []).some((i) => i.fulfilment === 'pickup') && (
                  <Field label="How would you like to collect?" hint="Show this at the counter when you collect">
                    <Select value={pickupMethod ?? ''} onChange={(e) => setPickupMethod(e.target.value)}>
                      {pickupMethods.offered.map((m) => (
                        <option key={m} value={m}>{m === 'QR' ? 'A QR code' : 'An order code'}</option>
                      ))}
                    </Select>
                  </Field>
                )}
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
                  disabled={placing
                    || (mustAcknowledge.length
                      ? mustAcknowledge.some((n) => ticked[n.topicSystemName] !== true)
                      : !acknowledged)
                    || (state.termsRequired && !terms)}
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

      <Panel title="Orders" subtitle="One order per seller and delivery choice, under one reference">
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

      {result.payment && result.payment.status !== 'Paid' && (
        <Alert tone="info" title="Your payment is still being confirmed">
          {result.payment.customerAction ?? 'We will send you a message as soon as the provider confirms it.'}
          <div className="mt-2">
            <Button as="link" to={`/payment-status/${result.orders[0].orderNumber}`}>Payment status</Button>
          </div>
        </Alert>
      )}

      <div className="flex gap-2">
        <Button as="link" to="/account/orders" variant="brand">My orders</Button>
        <Button as="link" to={`/payment-status/${result.orders[0].orderNumber}`}>Payment status</Button>
        <Button as="link" to="/">Continue shopping</Button>
      </div>
    </div>
  );
}
