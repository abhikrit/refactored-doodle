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
