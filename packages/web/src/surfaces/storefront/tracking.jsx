// DefaultClean storefront - tracking a parcel, checking an order as a guest, and the
// notification preferences of My account.

import React, { useCallback, useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../../lib/api.js';
import {
  Alert, Button, Field, Grid, Input, Panel, Select, Spinner, Checkbox,
} from '../../ui/nop/kit.jsx';
import { AccountLayout } from './account.jsx';
import { useProduct } from '../../lib/store.jsx';

const when = (v) => (v ? new Date(v).toLocaleString('en-GB') : '');

function Timeline({ events }) {
  return (
    <ol className="relative border-l border-store-border ml-2 space-y-3">
      {events.map((e) => (
        <li key={e.id ?? `${e.eventCode}-${e.at}`} className="pl-4">
          <span className="absolute -left-[5px] mt-1.5 size-2.5 rounded-full brand-bg" />
          <div className="text-[13.5px] font-medium text-store-text">{e.displayName ?? e.eventCode}</div>
          <div className="text-[12px] text-nop-muted">
            {when(e.at)}
            {e.location ? ` · ${e.location}` : ''}
          </div>
        </li>
      ))}
    </ol>
  );
}

/* ====================================================== the public tracking page ======= */

export function PublicTracking() {
  const { trackingNumber } = useParams();
  const { customer } = useProduct();
  const [view, setView] = useState(null);
  const [captcha, setCaptcha] = useState('');
  const [share, setShare] = useState(null);
  const [notice, setNotice] = useState(null);

  const load = useCallback(async (response = null) => {
    const query = response ? `?captcha=${encodeURIComponent(response)}` : '';
    setView(await api.get(`/tracking-hub/public/${encodeURIComponent(trackingNumber)}${query}`).catch(() => null));
  }, [trackingNumber]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (!view?.refreshSeconds) return undefined;
    const timer = setInterval(() => load(), Number(view.refreshSeconds) * 1000);
    return () => clearInterval(timer);
  }, [view?.refreshSeconds, load]);

  const refresh = async () => {
    const fresh = await api.post(`/tracking-hub/public/${encodeURIComponent(trackingNumber)}/refresh`, {}).catch(() => null);
    if (fresh?.ok) setView({ ...view, events: fresh.events, lastUpdated: fresh.lastUpdated });
  };

  const makeShareLink = async () => {
    const created = await api.post('/tracking-hub/share', { reference: trackingNumber }).catch((err) => ({ ok: false, message: err.message }));
    if (created.ok) setShare(created);
    else setNotice({ tone: 'error', text: created.message ?? 'That link could not be created.' });
  };

  if (!view) return <Spinner label="Looking for your parcel" />;

  if (view.captchaRequired && !view.found) {
    return (
      <div className="max-w-xl mx-auto space-y-4">
        <h1 className="nop-page-title">{`Tracking ${trackingNumber}`}</h1>
        <Panel title="One more step">
          <p className="text-[13.5px] text-store-text">We need to check that you are not a robot before showing this parcel again.</p>
          <div className="mt-3 flex items-end gap-2">
            <Field label="Verification"><Input value={captcha} onChange={(e) => setCaptcha(e.target.value)} placeholder="type anything in the prototype" /></Field>
            <Button variant="brand" onClick={() => load(captcha)} disabled={!captcha.trim()}>Continue</Button>
          </div>
        </Panel>
      </div>
    );
  }

  if (!view.found) {
    return (
      <div className="max-w-xl mx-auto space-y-4">
        <h1 className="nop-page-title">{`Tracking ${trackingNumber}`}</h1>
        <Alert tone="warning">{view.message}</Alert>
        <Button as="link" to="/order-status">Check an order instead</Button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <h1 className="nop-page-title">{`Tracking ${trackingNumber}`}</h1>
      {notice && <Alert tone={notice.tone}>{notice.text}</Alert>}
      <Panel
        title={view.expectedDeliveryRange ? `Expected ${view.expectedDeliveryRange}` : 'Your parcel'}
        subtitle={view.lastUpdated}
        actions={<Button size="sm" onClick={refresh}>{view.refreshLabel ?? 'Refresh'}</Button>}
      >
        {view.events.length === 0
          ? <Alert tone="info">{view.message}</Alert>
          : <Timeline events={view.events} />}
        {view.agentContact && (
          <p className="mt-3 text-[12.5px] text-nop-muted">{`Delivery agent: ${view.agentContact}`}</p>
        )}
      </Panel>
      {customer && (
        <Panel title="Share this parcel" subtitle="A link that shows the updates and nothing about your account.">
          {share
            ? (
              <div className="space-y-2">
                <Input readOnly value={`${window.location.origin}${share.link}`} />
                <p className="text-[12px] text-nop-muted">
                  {share.expiresOnUtc ? `The link stops working on ${when(share.expiresOnUtc)}.` : 'The link has no expiry set.'}
                </p>
                <Button
                  size="sm"
                  onClick={async () => {
                    await api.post(`/tracking-hub/share/${share.token}/revoke`, {});
                    setShare(null);
                    setNotice({ tone: 'success', text: 'The link was withdrawn.' });
                  }}
                >
                  Withdraw the link
                </Button>
              </div>
            )
            : <Button variant="brand" onClick={makeShareLink}>Create a link</Button>}
        </Panel>
      )}
    </div>
  );
}

/** The share-link view: the same timeline, opened by the signature alone. */
export function SharedTracking() {
  const { token } = useParams();
  const [view, setView] = useState(null);
  useEffect(() => { api.get(`/tracking-hub/share/${token}`).then(setView).catch(() => setView({ ok: false, message: 'That link is not valid.' })); }, [token]);
  if (!view) return <Spinner label="Opening the link" />;
  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <h1 className="nop-page-title">A parcel on its way</h1>
      {view.ok !== true
        ? <Alert tone="warning">{view.message}</Alert>
        : (
          <Panel title={view.expectedDeliveryRange ? `Expected ${view.expectedDeliveryRange}` : 'Updates'} subtitle={view.lastUpdated}>
            {view.events?.length ? <Timeline events={view.events} /> : <Alert tone="info">{view.message}</Alert>}
          </Panel>
        )}
    </div>
  );
}

/* ====================================================== the guest lookup =============== */

export function OrderStatus() {
  const [form, setForm] = useState({ orderNumber: '', contact: '', captcha: '' });
  const [result, setResult] = useState(null);

  const check = async () => {
    setResult(await api.post('/tracking-hub/guest-lookup', {
      orderNumber: form.orderNumber, contact: form.contact, captcha: form.captcha || null,
    }).catch((err) => ({ ok: false, message: err.message })));
  };

  return (
    <div className="max-w-xl mx-auto space-y-4">
      <h1 className="nop-page-title">Check an order</h1>
      <Panel subtitle="Your order number and the e-mail or phone you used.">
        <div className="space-y-3">
          <Field label="Order number" required>
            <Input value={form.orderNumber} onChange={(e) => setForm({ ...form, orderNumber: e.target.value })} placeholder="MP-2026-000001" />
          </Field>
          <Field label="E-mail or phone used on the order" required>
            <Input value={form.contact} onChange={(e) => setForm({ ...form, contact: e.target.value })} />
          </Field>
          {result?.captchaRequired && (
            <Field label="Verification" hint="we check this after several tries">
              <Input value={form.captcha} onChange={(e) => setForm({ ...form, captcha: e.target.value })} />
            </Field>
          )}
          <Button variant="brand" onClick={check} disabled={!form.orderNumber || !form.contact}>Check</Button>
        </div>
      </Panel>

      {result && result.ok !== true && <Alert tone="warning">{result.message}</Alert>}
      {result?.ok === true && (
        <Panel title={`Order ${result.orderNumber}`} subtitle={`${result.status ?? ''} · ${result.maskedContact ?? ''}`}>
          {(result.shipments ?? []).length === 0
            ? <Alert tone="info">This order has no parcel yet.</Alert>
            : result.shipments.map((shipment) => (
              <div key={shipment.trackingNumber} className="mb-4">
                <div className="text-[13px] font-medium mb-2">
                  <Link className="underline" to={`/track/${shipment.trackingNumber}`}>{shipment.trackingNumber}</Link>
                </div>
                {shipment.events.length ? <Timeline events={shipment.events} /> : <p className="text-[12.5px] text-nop-muted">No updates yet.</p>}
              </div>
            ))}
        </Panel>
      )}
    </div>
  );
}

/* ====================================================== notification preferences ====== */

export function AccountNotifications() {
  const { customer } = useProduct();
  const [matrix, setMatrix] = useState(null);
  const [orders, setOrders] = useState(null);
  const [subscriptions, setSubscriptions] = useState({});
  const [notice, setNotice] = useState(null);

  const load = useCallback(async () => {
    if (!customer) return;
    setMatrix(await api.get(`/notification-preferences/matrix?customerId=${customer.id}`).catch(() => null));
    const mine = await api.get('/tracking-hub/my-orders').catch(() => null);
    setOrders(mine?.orders ?? []);
    const live = await api.get('/orders?mine=true').catch(() => []);
    const state = {};
    for (const order of live ?? []) {
      const row = await api.get(`/notification-preferences/orders/${order.id}`).catch(() => null);
      if (row) state[order.orderNumber] = { id: order.id, subscribed: row.subscribed };
    }
    setSubscriptions(state);
  }, [customer?.id]);

  useEffect(() => { load(); }, [load]);

  const toggle = async (category, channel, allowed) => {
    const saved = await api.post('/notification-preferences/matrix', {
      customerId: customer.id, category, channel, optedOut: !allowed, optedIn: allowed,
    }).catch((err) => ({ ok: false, message: err.message }));
    setNotice(saved.ok === false
      ? { tone: 'error', text: saved.message ?? 'That change was not saved.' }
      : { tone: 'success', text: 'Saved.' });
    load();
  };

  const setQuietHours = async (value) => {
    await api.post('/notification-preferences/matrix', {
      customerId: customer.id, channel: 'sms', category: null, quietHours: value,
    }).catch(() => {});
    setNotice({ tone: 'success', text: value ? `We will not write to you between ${value}.` : 'Quiet hours cleared.' });
    load();
  };

  const toggleOrder = async (orderNumber, subscribed) => {
    const row = subscriptions[orderNumber];
    if (!row) return;
    const saved = await api.post(`/notification-preferences/orders/${row.id}`, { subscribed }).catch(() => null);
    if (saved?.message) setNotice({ tone: 'success', text: saved.message });
    load();
  };

  return (
    <AccountLayout title="Messages from us">
      {notice && <Alert tone={notice.tone}>{notice.text}</Alert>}
      <Panel title="What we may send you" subtitle="Tick the ways we may reach you about each kind of message.">
        {!matrix ? <Spinner /> : (
          <div className="overflow-x-auto">
            <table className="w-full text-[13px]">
              <thead>
                <tr className="bg-nop-head text-left">
                  <th className="px-3 py-2 font-semibold">Kind of message</th>
                  {matrix.channels.map((c) => <th key={c} className="px-3 py-2 font-semibold capitalize">{c}</th>)}
                </tr>
              </thead>
              <tbody>
                {matrix.rows.map((row) => (
                  <tr key={row.category} className="border-t border-gray-100">
                    <td className="px-3 py-2">
                      {row.category}
                      {row.mandatory && <span className="ml-2 text-[11.5px] text-nop-muted">(always sent)</span>}
                    </td>
                    {matrix.channels.map((channel) => {
                      const cell = row.channels[channel];
                      return (
                        <td key={channel} className="px-3 py-2">
                          <Checkbox
                            label=""
                            checked={cell.allowed && (!cell.needsOptIn || cell.optedIn)}
                            disabled={!row.changeable}
                            onChange={(e) => toggle(row.category, channel, e.target.checked)}
                          />
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>

      <Panel title="Quiet hours" subtitle="We hold anything that is not urgent until the morning.">
        <div className="flex flex-wrap items-end gap-2">
          <Field label="From and to (hours)">
            <Select value={matrix?.quietHours ?? ''} onChange={(e) => setQuietHours(e.target.value)}>
              <option value="">No quiet hours</option>
              {['20-07', '21-07', '22-06', '23-05'].map((v) => <option key={v} value={v}>{v.replace('-', ' to ')}</option>)}
            </Select>
          </Field>
          {matrix?.quietHoursFrom && <span className="text-[12px] text-nop-muted pb-2">{`Taken from ${matrix.quietHoursFrom}`}</span>}
        </div>
      </Panel>

      <Panel title="Updates per order" bodyClass="p-0" subtitle="You can stop the updates for one order without changing anything else.">
        {!orders ? <Spinner /> : (
          <Grid
            rows={orders}
            rowKey={(o) => o.orderNumber}
            empty="You have no orders yet."
            columns={[
              { key: 'orderNumber', header: 'Order' },
              { key: 'latest', header: 'Latest update', render: (o) => (o.latestEvent ? `${o.latestEvent.name} · ${when(o.latestEvent.at)}` : 'No updates yet') },
              { key: 'expected', header: 'Expected', render: (o) => o.expectedDeliveryRange ?? '-' },
              {
                key: 'subscribed',
                header: 'Updates',
                render: (o) => {
                  const row = subscriptions[o.orderNumber];
                  if (!row) return '-';
                  return (
                    <Button size="sm" onClick={() => toggleOrder(o.orderNumber, !row.subscribed)}>
                      {row.subscribed ? 'Stop updates' : 'Start updates'}
                    </Button>
                  );
                },
              },
            ]}
          />
        )}
      </Panel>
    </AccountLayout>
  );
}
