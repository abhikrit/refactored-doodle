// nopCommerce administration - the payment screens of this wave.
//
// Payment methods and routing rules: the native payment-methods list extended with the product's
// own routing rules, and the connector panel every adapter is configured from. The coverage areas
// a rural or urban rule is matched against belong to the logistics module, not to payments.

import React, { useCallback, useEffect, useState } from 'react';
import { api } from '../../lib/api.js';
import { AdminPage } from '../../ui/nop/shells.jsx';
import {
  Alert, Badge, Breadcrumb, Button, Citation, Field, Grid, Input, Panel, Select, Spinner,
} from '../../ui/nop/kit.jsx';

const crumb = (...items) => (
  <Breadcrumb items={[{ label: 'Dashboard', to: '/admin' }, { label: 'Configuration' }, ...items]} />
);

const EMPTY_RULE = {
  methodSystemName: '', dimension: 'locationType', operator: 'in', values: '',
};
const EMPTY_CREDENTIAL = { systemName: '', key: 'apikey', value: '' };

const OPERATOR_LABEL = {
  in: 'is one of', notIn: 'is not one of', range: 'is between',
};

export function AdminPaymentRouting() {
  const [data, setData] = useState(null);
  const [connectors, setConnectors] = useState(null);
  const [rule, setRule] = useState(EMPTY_RULE);
  const [credential, setCredential] = useState(EMPTY_CREDENTIAL);
  const [notice, setNotice] = useState(null);
  const [denied, setDenied] = useState(null);

  const load = useCallback(() => {
    api.get('/payments/admin/methods')
      .then((d) => { setData(d); setDenied(null); })
      .catch((err) => setDenied(err.message ?? 'Access denied'));
    api.get('/payments/admin/connectors').then(setConnectors).catch(() => {});
  }, []);
  useEffect(load, [load]);

  const toggleMethod = async (method) => {
    const res = await api.post(`/payments/admin/methods/${method.systemName}/active`, { active: !method.active });
    if (res.ok !== true) { setNotice({ tone: 'error', text: res.message ?? 'The method was not changed.' }); return; }
    setNotice({
      tone: 'success',
      text: method.active
        ? `${method.name} is no longer offered at checkout. ${res.existingOrdersKept} order(s) already paid with it keep their records.`
        : `${method.name} is offered at checkout.`,
    });
    load();
  };

  const saveRule = async () => {
    const values = rule.operator === 'range'
      ? rule.values.split(',').map((v) => (v.trim() === '' ? null : Number(v.trim())))
      : rule.values.split(',').map((v) => v.trim()).filter(Boolean);
    const res = await api.post('/payments/admin/routing-rules', { ...rule, values });
    if (res.ok !== true) { setNotice({ tone: 'error', text: res.message ?? 'The rule was not saved.' }); return; }
    setNotice({ tone: 'success', text: 'The routing rule was saved. A method is offered only if every rule that applies to it allows it.' });
    setRule(EMPTY_RULE);
    load();
  };

  const toggleRule = async (row) => {
    await api.post(`/payments/admin/routing-rules/${row.id}/active`, { isActive: !row.isActive });
    load();
  };

  const saveCredential = async () => {
    const res = await api.post('/payments/admin/credentials', credential);
    if (res.ok !== true) { setNotice({ tone: 'error', text: res.message ?? 'The credential was not saved.' }); return; }
    setNotice({
      tone: 'success',
      text: 'The credential is held encrypted for this instance only. It is never written to a configuration pack or an export.',
    });
    setCredential({ ...EMPTY_CREDENTIAL, systemName: credential.systemName });
    load();
  };

  if (denied) {
    return (
      <AdminPage title="Payment methods and routing rules" breadcrumb={crumb({ label: 'Payment methods and routing rules' })}>
        <Alert tone="error" title="Access denied">{denied}</Alert>
      </AdminPage>
    );
  }

  const rules = (data?.methods ?? []).flatMap((m) => m.rules.map((r) => ({ ...r, methodName: m.name })));

  return (
    <AdminPage
      title="Payment methods and routing rules"
      breadcrumb={crumb({ label: 'Payment methods and routing rules' })}
      intro="Which payment methods this store offers, and where each one is offered: by shop, country, customer type, rural or urban location, pickup or delivery, type of service, order value, seller or item."
    >
      {notice && <Alert tone={notice.tone}>{notice.text}</Alert>}

      <Panel title="Payment methods" bodyClass="p-0">
        {!data ? <Spinner /> : (
          <Grid
            columns={[
              { key: 'name', header: 'Payment method' },
              {
                key: 'systemName',
                header: 'System name',
                render: (m) => <span className="font-mono text-[12px]">{m.systemName}</span>,
              },
              { key: 'methodType', header: 'Type' },
              {
                key: 'recurringPaymentType',
                header: 'Recurring',
                render: (m) => (m.recurringPaymentType === 'NotSupported'
                  ? <span className="text-nop-muted">not supported</span>
                  : m.recurringPaymentType),
              },
              {
                key: 'supportsGroupPayment',
                header: 'One payment for several sellers',
                render: (m) => <Badge tone={m.supportsGroupPayment ? 'green' : 'slate'}>{m.supportsGroupPayment ? 'Yes' : 'No'}</Badge>,
              },
              {
                key: 'rules',
                header: 'Rules',
                align: 'right',
                render: (m) => (m.rules.length ? `${m.rules.length}` : '-'),
              },
              {
                key: 'active',
                header: 'Active',
                render: (m) => <Badge tone={m.active ? 'green' : 'slate'}>{m.active ? 'Active' : 'Not active'}</Badge>,
              },
              {
                key: 'actions',
                header: '',
                render: (m) => (
                  <Button variant={m.active ? 'default' : 'primary'} onClick={() => toggleMethod(m)}>
                    {m.active ? 'Deactivate' : 'Activate'}
                  </Button>
                ),
              },
            ]}
            rows={data.methods}
            rowKey={(m) => m.systemName}
          />
        )}
      </Panel>

      <Panel title="Routing rules" bodyClass="p-0">
        {!data ? <Spinner /> : (
          <Grid
            columns={[
              { key: 'methodName', header: 'Payment method' },
              { key: 'dimensionLabel', header: 'Applies to' },
              { key: 'operator', header: 'Test', render: (r) => OPERATOR_LABEL[r.operator] ?? r.operator },
              { key: 'values', header: 'Values', render: (r) => (r.values ?? []).join(', ') },
              {
                key: 'isActive',
                header: 'Active',
                render: (r) => <Badge tone={r.isActive ? 'green' : 'slate'}>{r.isActive ? 'Active' : 'Off'}</Badge>,
              },
              {
                key: 'actions',
                header: '',
                render: (r) => <Button onClick={() => toggleRule(r)}>{r.isActive ? 'Switch off' : 'Switch on'}</Button>,
              },
            ]}
            rows={rules}
            rowKey={(r) => r.id}
            empty="No routing rule yet. Without a rule, an active method is offered everywhere."
          />
        )}
      </Panel>

      <Panel title="Add a routing rule">
        {!data ? <Spinner /> : (
          <div className="grid gap-3 md:grid-cols-4">
            <Field label="Payment method" required>
              <Select value={rule.methodSystemName} onChange={(e) => setRule({ ...rule, methodSystemName: e.target.value })}>
                <option value="">Choose a method</option>
                {data.methods.map((m) => <option key={m.systemName} value={m.systemName}>{m.name}</option>)}
              </Select>
            </Field>
            <Field label="Applies to" required>
              <Select value={rule.dimension} onChange={(e) => setRule({ ...rule, dimension: e.target.value })}>
                {data.dimensions.map((d) => <option key={d.value} value={d.value}>{d.label}</option>)}
              </Select>
            </Field>
            <Field label="Test" required>
              <Select value={rule.operator} onChange={(e) => setRule({ ...rule, operator: e.target.value })}>
                {data.operators.map((o) => <option key={o} value={o}>{OPERATOR_LABEL[o] ?? o}</option>)}
              </Select>
            </Field>
            <Field
              label="Values"
              required
              hint={rule.operator === 'range' ? 'the lowest and highest value, separated by a comma' : 'separated by commas'}
            >
              <Input
                value={rule.values}
                onChange={(e) => setRule({ ...rule, values: e.target.value })}
                placeholder={rule.dimension === 'locationType' ? 'rural' : rule.operator === 'range' ? '5000, 200000' : 'pickup'}
              />
            </Field>
            <div className="md:col-span-4">
              <Button
                variant="primary"
                disabled={!rule.methodSystemName || !rule.values}
                onClick={saveRule}
              >
                Save rule
              </Button>
              <Citation className="mt-2">
                A method is shown only if it is active, allowed for the shop and the customer type, and every rule
                that applies to it allows it. The rural or urban value of an address is read from the coverage areas
                of the logistics module ({data.coverageAreaSource}); payments keeps none of its own, so an address in
                no coverage area matches neither a rural nor an urban rule.
              </Citation>
            </div>
          </div>
        )}
      </Panel>

      <Panel title="Provider connectors">
        {!connectors ? <Spinner /> : (
          <>
            <Grid
              dense
              columns={[
                { key: 'name', header: 'Adapter' },
                {
                  key: 'implementsPaymentMethod',
                  header: 'Where it appears',
                  render: (c) => (c.implementsPaymentMethod ? 'Checkout' : 'Payout registry only'),
                },
                ...connectors.operations.map((operation) => ({
                  key: operation,
                  header: operation,
                  render: (c) => (c.capabilities[operation]
                    ? <Badge tone="green">Yes</Badge>
                    : <Badge tone="slate" title="The console offers the manual path instead">No</Badge>),
                })),
              ]}
              rows={connectors.connectors}
              rowKey={(c) => c.systemName}
            />
            <Citation className="mt-2">
              A provider is added by building one adapter against this contract. An operation an adapter cannot do
              answers Not supported, and staff do that step by hand in the provider portal instead.
            </Citation>
          </>
        )}
      </Panel>

      <Panel title="Provider credentials">
        <div className="grid gap-3 md:grid-cols-3">
          <Field label="Adapter" required>
            <Select value={credential.systemName} onChange={(e) => setCredential({ ...credential, systemName: e.target.value })}>
              <option value="">Choose an adapter</option>
              {(connectors?.connectors ?? []).map((c) => <option key={c.systemName} value={c.systemName}>{c.name}</option>)}
            </Select>
          </Field>
          <Field label="Credential" required hint="the key, token or signing secret the provider issued">
            <Select value={credential.key} onChange={(e) => setCredential({ ...credential, key: e.target.value })}>
              <option value="apikey">API key</option>
              <option value="callbacksecret">Callback signing secret</option>
              <option value="callbacktoken">Callback token</option>
            </Select>
          </Field>
          <Field label="Value" required>
            <Input
              type="password"
              value={credential.value}
              onChange={(e) => setCredential({ ...credential, value: e.target.value })}
              placeholder="entered once, on this instance"
            />
          </Field>
        </div>
        <div className="mt-3">
          <Button variant="primary" disabled={!credential.systemName || !credential.value} onClick={saveCredential}>
            Save credential
          </Button>
          <Citation className="mt-2">
            Credentials are entered per instance, held encrypted and never carried in a configuration pack or an
            export: a key like this is refused by the pack loader wherever it appears.
          </Citation>
        </div>
      </Panel>
    </AdminPage>
  );
}
