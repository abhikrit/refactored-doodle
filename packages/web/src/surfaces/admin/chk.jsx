// nopCommerce administration - the checkout screens: delivery windows and their bookings.
// Cart restriction rules and legal notices are on the same screen group and come with their own
// features.

import React, { useCallback, useEffect, useState } from 'react';
import { api } from '../../lib/api.js';
import { AdminPage } from '../../ui/nop/shells.jsx';
import {
  Alert, Badge, Breadcrumb, Button, Checkbox, Field, Grid, Input, Panel, Select, Spinner, StatTile,
} from '../../ui/nop/kit.jsx';

const crumb = (...items) => (
  <Breadcrumb items={[{ label: 'Dashboard', to: '/admin' }, { label: 'Configuration' }, ...items]} />
);

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const EMPTY = {
  shippingMethod: '', area: '', dayOfWeek: 'Mon', start: '08:00', end: '12:00', capacity: 30, isActive: true,
};

export function AdminDeliveryWindows() {
  const [data, setData] = useState(null);
  const [methods, setMethods] = useState([]);
  const [form, setForm] = useState(EMPTY);
  const [notice, setNotice] = useState(null);
  const [denied, setDenied] = useState(null);

  const load = useCallback(() => {
    api.get('/checkout-area/admin/delivery-windows')
      .then((d) => { setData(d); setDenied(null); })
      .catch((err) => setDenied(err.message ?? 'Access denied'));
    api.get('/logistics/methods').then(setMethods).catch(() => {});
  }, []);
  useEffect(load, [load]);

  const save = async () => {
    const res = await api.post('/checkout-area/admin/delivery-windows', form);
    if (res.ok !== true) { setNotice({ tone: 'error', text: res.message ?? 'The window was not saved.' }); return; }
    setNotice({ tone: 'success', text: `Window ${res.window.name} saved for ${res.window.area} on ${res.window.dayOfWeek}.` });
    setForm(EMPTY);
    load();
  };
  const deactivate = async (id) => {
    await api.del(`/checkout-area/admin/delivery-windows/${id}`);
    setNotice({ tone: 'success', text: 'The window is no longer offered.' });
    load();
  };

  if (denied) {
    return (
      <AdminPage title="Delivery windows" breadcrumb={crumb({ label: 'Delivery windows' })}>
        <Alert tone="error" title="Access denied">{denied}</Alert>
      </AdminPage>
    );
  }

  const windows = data?.windows ?? [];
  const bookings = data?.bookings ?? [];
  const reserved = bookings.filter((b) => b.status === 'Reserved');

  return (
    <AdminPage
      title="Delivery windows"
      breadcrumb={crumb({ label: 'Delivery windows' })}
      intro="The time windows offered at checkout for a delivery service and an area, and how much capacity each one still has."
    >
      {notice && <Alert tone={notice.tone}>{notice.text}</Alert>}

      <div className="grid gap-3 sm:grid-cols-3">
        <StatTile label="Windows offered" value={windows.filter((w) => w.isActive !== false).length} />
        <StatTile label="Places taken" value={reserved.length} tone="blue" />
        <StatTile label="Places given back" value={bookings.filter((b) => b.status === 'Released').length} tone="slate" />
      </div>

      <Panel title="Add a window" subtitle="A window belongs to one delivery service and one area.">
        <div className="grid gap-3 md:grid-cols-3">
          <Field label="Delivery service" required>
            <Select value={form.shippingMethod} onChange={(e) => setForm({ ...form, shippingMethod: e.target.value })}>
              <option value="">Choose a service</option>
              {methods.map((m) => <option key={m.name} value={m.name}>{m.name}</option>)}
            </Select>
          </Field>
          <Field label="Area" required hint="The city or district this window serves">
            <Input value={form.area} onChange={(e) => setForm({ ...form, area: e.target.value })} />
          </Field>
          <Field label="Day" required>
            <Select value={form.dayOfWeek} onChange={(e) => setForm({ ...form, dayOfWeek: e.target.value })}>
              {DAYS.map((d) => <option key={d} value={d}>{d}</option>)}
            </Select>
          </Field>
          <Field label="From" required>
            <Input type="time" value={form.start} onChange={(e) => setForm({ ...form, start: e.target.value })} />
          </Field>
          <Field label="To" required>
            <Input type="time" value={form.end} onChange={(e) => setForm({ ...form, end: e.target.value })} />
          </Field>
          <Field label="Capacity" required hint="How many orders this window can take">
            <Input type="number" min="1" value={form.capacity} onChange={(e) => setForm({ ...form, capacity: Number(e.target.value) })} />
          </Field>
        </div>
        <div className="mt-3 flex items-center gap-3">
          <Checkbox label="Offered to shoppers" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} />
          <Button variant="primary" onClick={save}>Save</Button>
        </div>
      </Panel>

      <Panel title="Windows" bodyClass="p-0">
        {!data ? <Spinner /> : (
          <Grid
            columns={[
              { key: 'shippingMethod', header: 'Service' },
              { key: 'area', header: 'Area' },
              { key: 'dayOfWeek', header: 'Day' },
              { key: 'time', header: 'Time', render: (w) => `${w.start} - ${w.end}` },
              { key: 'capacity', header: 'Capacity', align: 'right' },
              {
                key: 'taken',
                header: 'Places taken',
                align: 'right',
                render: (w) => reserved.filter((b) => Number(b.definitionId) === Number(w.id)).length,
              },
              {
                key: 'isActive',
                header: 'Offered',
                render: (w) => <Badge tone={w.isActive === false ? 'slate' : 'green'}>{w.isActive === false ? 'No' : 'Yes'}</Badge>,
              },
              {
                key: 'actions',
                header: '',
                render: (w) => (w.isActive === false
                  ? null
                  : <Button size="sm" variant="danger" onClick={() => deactivate(w.id)}>Stop offering</Button>),
              },
            ]}
            rows={windows}
            rowKey={(w) => w.id}
          />
        )}
      </Panel>

      <Panel title="Booked places" bodyClass="p-0" subtitle="A place is held when the order is placed and given back if the order is cancelled.">
        {!data ? <Spinner /> : (
          <Grid
            dense
            columns={[
              { key: 'date', header: 'Date' },
              {
                key: 'window',
                header: 'Window',
                render: (b) => {
                  const w = windows.find((x) => Number(x.id) === Number(b.definitionId));
                  return w ? `${w.area} ${w.start}-${w.end}` : '-';
                },
              },
              { key: 'orderNumber', header: 'Order', render: (b) => b.orderNumber ?? '-' },
              {
                key: 'status',
                header: 'Status',
                render: (b) => (
                  <Badge tone={b.status === 'Reserved' ? 'blue' : (b.status === 'Fulfilled' ? 'green' : 'slate')}>{b.status}</Badge>
                ),
              },
            ]}
            rows={bookings}
            rowKey={(b) => b.id}
          />
        )}
      </Panel>

      {data?.instructionsAttribute && (
        <Panel title="Delivery instructions" subtitle="The checkout attribute shoppers write their instructions in.">
          <p className="text-[13px]">
            <span className="font-medium">{data.instructionsAttribute.name}</span>
            {' - '}
            a {String(data.instructionsAttribute.attributeControlType ?? 'TextBox').toLowerCase()}
            {data.instructionsAttribute.maxLength ? `, up to ${data.instructionsAttribute.maxLength} characters` : ''}
            {data.instructionsAttribute.isRequired ? ', which must be filled in' : ', which may be left empty'}
            . The text is kept with the order and shown to staff, the seller and the courier.
          </p>
        </Panel>
      )}
    </AdminPage>
  );
}


/* ====================================================== cart restriction rules ======== */

const RULE_KINDS = [
  { id: 'ProhibitedCombination', label: 'These items cannot be bought together' },
  { id: 'PickupOnly', label: 'This item can only be collected' },
  { id: 'DeliveryConstraint', label: 'This item is only delivered to certain areas' },
];
const SCOPE_KINDS = [
  { id: 'product', label: 'a product' },
  { id: 'category', label: 'a category' },
  { id: 'vendor', label: 'a seller' },
];

const EMPTY_RULE = {
  type: 'ProhibitedCombination',
  scopeAKind: 'product',
  scopeAId: '',
  scopeBKind: 'product',
  scopeBId: '',
  areas: '',
  messageText: '',
  isActive: true,
};

export function AdminCartRules() {
  const [rules, setRules] = useState(null);
  const [form, setForm] = useState(EMPTY_RULE);
  const [notice, setNotice] = useState(null);
  const [denied, setDenied] = useState(null);

  const load = useCallback(() => {
    api.get('/checkout-area/cart-rules')
      .then((r) => { setRules(r); setDenied(null); })
      .catch((err) => setDenied(err.message ?? 'Access denied'));
  }, []);
  useEffect(load, [load]);

  const save = async () => {
    const body = {
      type: form.type,
      scopeA: form.scopeAId ? { kind: form.scopeAKind, id: form.scopeAId } : null,
      scopeB: form.type === 'ProhibitedCombination' && form.scopeBId
        ? { kind: form.scopeBKind, id: form.scopeBId }
        : null,
      areas: form.areas ? form.areas.split(',').map((a) => a.trim()).filter(Boolean) : [],
      messageText: form.messageText,
      isActive: form.isActive,
    };
    const res = await api.post('/checkout-area/cart-rules', body);
    if (res.ok !== true) { setNotice({ tone: 'error', text: res.message ?? 'The rule was not saved.' }); return; }
    setNotice({ tone: 'success', text: 'The rule is in force.' });
    setForm(EMPTY_RULE);
    load();
  };

  const setActive = async (rule, isActive) => {
    await api.post(`/checkout-area/cart-rules/${rule.id}/active`, { isActive });
    setNotice({ tone: 'success', text: isActive ? 'The rule is in force again.' : 'The rule no longer applies.' });
    load();
  };

  if (denied) {
    return (
      <AdminPage title="Cart restriction rules" breadcrumb={crumb({ label: 'Cart restriction rules' })}>
        <Alert tone="error" title="Access denied">{denied}</Alert>
      </AdminPage>
    );
  }

  return (
    <AdminPage
      title="Cart restriction rules"
      breadcrumb={crumb({ label: 'Cart restriction rules' })}
      intro="Rules that stop items being bought together, make an item collection-only, or limit where it is delivered. A rule applies as soon as it is saved, at the cart and again when the order is placed."
    >
      {notice && <Alert tone={notice.tone}>{notice.text}</Alert>}

      <Panel title="Add a rule">
        <div className="grid gap-3 md:grid-cols-2">
          <Field label="What the rule does" required>
            <Select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
              {RULE_KINDS.map((k) => <option key={k.id} value={k.id}>{k.label}</option>)}
            </Select>
          </Field>
          <Field label="The text the shopper reads" required hint="It is shown with the warning, so write it for them">
            <Input value={form.messageText} onChange={(e) => setForm({ ...form, messageText: e.target.value })} />
          </Field>
          <Field label="It applies to" required>
            <div className="flex gap-2">
              <Select value={form.scopeAKind} onChange={(e) => setForm({ ...form, scopeAKind: e.target.value })}>
                {SCOPE_KINDS.map((k) => <option key={k.id} value={k.id}>{k.label}</option>)}
              </Select>
              <Input placeholder="its number" value={form.scopeAId} onChange={(e) => setForm({ ...form, scopeAId: e.target.value })} />
            </div>
          </Field>
          {form.type === 'ProhibitedCombination' && (
            <Field label="And cannot be with" required>
              <div className="flex gap-2">
                <Select value={form.scopeBKind} onChange={(e) => setForm({ ...form, scopeBKind: e.target.value })}>
                  {SCOPE_KINDS.map((k) => <option key={k.id} value={k.id}>{k.label}</option>)}
                </Select>
                <Input placeholder="its number" value={form.scopeBId} onChange={(e) => setForm({ ...form, scopeBId: e.target.value })} />
              </div>
            </Field>
          )}
          {form.type === 'DeliveryConstraint' && (
            <Field label="Delivered only to" hint="Areas, separated by commas">
              <Input value={form.areas} onChange={(e) => setForm({ ...form, areas: e.target.value })} />
            </Field>
          )}
        </div>
        <div className="mt-3 flex items-center gap-3">
          <Checkbox label="In force" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} />
          <Button variant="primary" onClick={save}>Save</Button>
        </div>
      </Panel>

      <Panel title="Rules" bodyClass="p-0">
        {!rules ? <Spinner /> : (
          <Grid
            columns={[
              { key: 'type', header: 'Rule', render: (r) => RULE_KINDS.find((k) => k.id === r.type)?.label ?? r.type },
              { key: 'scopeA', header: 'Applies to', render: (r) => `${r.scopeA?.kind ?? '-'} ${r.scopeA?.id ?? ''}` },
              { key: 'scopeB', header: 'With', render: (r) => (r.scopeB ? `${r.scopeB.kind} ${r.scopeB.id}` : '-') },
              { key: 'areas', header: 'Areas', render: (r) => (r.areas ?? []).join(', ') || '-' },
              { key: 'messageText', header: 'What the shopper reads' },
              {
                key: 'isActive',
                header: 'In force',
                render: (r) => <Badge tone={r.isActive === false ? 'slate' : 'green'}>{r.isActive === false ? 'No' : 'Yes'}</Badge>,
              },
              {
                key: 'actions',
                header: '',
                render: (r) => (
                  <Button size="sm" variant={r.isActive === false ? 'primary' : 'danger'} onClick={() => setActive(r, r.isActive === false)}>
                    {r.isActive === false ? 'Put back in force' : 'Stop applying'}
                  </Button>
                ),
              },
            ]}
            rows={rules}
            rowKey={(r) => r.id}
            empty="No cart rule has been set for this client."
          />
        )}
      </Panel>
    </AdminPage>
  );
}

/* ====================================================== checkout notices ============== */

const POINT_LABELS = {
  cart: 'The cart page',
  shipping: 'The address and delivery step',
  payment: 'The payment step',
  confirm: 'The confirm step',
  completed: 'The order completed page',
};

export function AdminCheckoutNotices() {
  const [profile, setProfile] = useState(null);
  const [topics, setTopics] = useState([]);
  const [form, setForm] = useState({
    checkpoint: 'confirm', topicSystemName: '', requiresAcknowledgement: false, policySystemName: '',
  });
  const [limit, setLimit] = useState('');
  const [notice, setNotice] = useState(null);
  const [denied, setDenied] = useState(null);

  const load = useCallback(() => {
    api.get('/checkout-area/notices/profile')
      .then((p) => { setProfile(p); setLimit(p.confirmationTimeLimitHours ?? ''); setDenied(null); })
      .catch((err) => setDenied(err.message ?? 'Access denied'));
    api.get('/checkout-area/notices/topics').then(setTopics).catch(() => setTopics([]));
  }, []);
  useEffect(load, [load]);

  const save = async () => {
    const res = await api.post('/checkout-area/notices', {
      checkpoint: form.checkpoint,
      topicSystemName: form.topicSystemName,
      requiresAcknowledgement: form.requiresAcknowledgement,
      policySystemName: form.policySystemName || null,
    });
    if (res.ok !== true) { setNotice({ tone: 'error', text: res.message ?? 'The notice was not saved.' }); return; }
    setNotice({ tone: 'success', text: 'The notice will be shown at that point of checkout.' });
    load();
  };
  const remove = async (row) => {
    await api.post('/checkout-area/notices', { ...row, remove: true });
    setNotice({ tone: 'success', text: 'The notice is no longer shown.' });
    load();
  };
  const saveLimit = async () => {
    const res = await api.post('/checkout-area/notices/confirmation-time-limit', { hours: Number(limit) });
    setNotice(res.ok === true
      ? { tone: 'success', text: `A confirmation that has not gone out within ${limit} hours will be reported.` }
      : { tone: 'error', text: res.message ?? 'The limit was not saved.' });
    load();
  };

  if (denied) {
    return (
      <AdminPage title="Checkout notices" breadcrumb={crumb({ label: 'Checkout notices' })}>
        <Alert tone="error" title="Access denied">{denied}</Alert>
      </AdminPage>
    );
  }

  return (
    <AdminPage
      title="Checkout notices"
      breadcrumb={crumb({ label: 'Checkout notices' })}
      intro="The notices and acknowledgements the law of this country asks for, and where in checkout each one is shown. They are kept with the country's own profile, so data protection and e-commerce rules stay in one place."
    >
      {notice && <Alert tone={notice.tone}>{notice.text}</Alert>}

      <Panel title="Add a notice">
        <div className="grid gap-3 md:grid-cols-2">
          <Field label="Shown at" required>
            <Select value={form.checkpoint} onChange={(e) => setForm({ ...form, checkpoint: e.target.value })}>
              {Object.entries(POINT_LABELS).map(([id, label]) => <option key={id} value={id}>{label}</option>)}
            </Select>
          </Field>
          <Field label="The page it shows" required hint="One of the store's own pages">
            <Select value={form.topicSystemName} onChange={(e) => setForm({ ...form, topicSystemName: e.target.value })}>
              <option value="">Choose a page</option>
              {topics.map((t) => <option key={t.systemName} value={t.systemName}>{t.title}</option>)}
            </Select>
          </Field>
          <Field label="Policy it belongs to" hint="Leave empty unless the text is a versioned policy">
            <Input value={form.policySystemName} onChange={(e) => setForm({ ...form, policySystemName: e.target.value })} />
          </Field>
          <div className="self-end">
            <Checkbox
              label="The shopper must tick it before paying"
              checked={form.requiresAcknowledgement}
              onChange={(e) => setForm({ ...form, requiresAcknowledgement: e.target.checked })}
            />
          </div>
        </div>
        <div className="mt-3">
          <Button variant="primary" onClick={save} disabled={!form.topicSystemName}>Save</Button>
        </div>
      </Panel>

      <Panel title="Notices" bodyClass="p-0" subtitle={profile ? `The profile of ${profile.country}` : null}>
        {!profile ? <Spinner /> : (
          <Grid
            columns={[
              { key: 'checkpoint', header: 'Shown at', render: (r) => POINT_LABELS[r.checkpoint] ?? r.checkpoint },
              { key: 'topicSystemName', header: 'Page' },
              { key: 'policySystemName', header: 'Policy', render: (r) => r.policySystemName ?? '-' },
              {
                key: 'requiresAcknowledgement',
                header: 'Must be ticked',
                render: (r) => <Badge tone={r.requiresAcknowledgement ? 'amber' : 'slate'}>{r.requiresAcknowledgement ? 'Yes' : 'No'}</Badge>,
              },
              { key: 'scope', header: 'Applies to', render: (r) => (r.scope && r.scope !== 'all' ? `${r.scope} ${r.scopeValue ?? ''}` : 'every order') },
              {
                key: 'actions',
                header: '',
                render: (r) => <Button size="sm" variant="danger" onClick={() => remove(r)}>Stop showing</Button>,
              },
            ]}
            rows={profile.notices}
            rowKey={(r) => `${r.checkpoint}-${r.topicSystemName}`}
            empty="No notice has been set for this country."
          />
        )}
      </Panel>

      <Panel title="Confirmation time limit" subtitle="How long the order confirmation may take before it is reported.">
        <div className="flex items-end gap-3">
          <Field label="Hours">
            <Input type="number" min="0" value={limit} onChange={(e) => setLimit(e.target.value)} />
          </Field>
          <Button variant="primary" onClick={saveLimit}>Save</Button>
        </div>
        <p className="mt-2 text-[11.5px] text-nop-muted">
          A confirmation still waiting after this many hours appears on the checkout exceptions screen.
        </p>
      </Panel>
    </AdminPage>
  );
}
