// DefaultClean storefront - the payment status page.
//
// Where a shopper goes when they are not sure whether their payment went through: what the
// payment is doing now, what to do next, a button to try again where that is allowed, every
// attempt that has been made, and who to contact.

import React, { useCallback, useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../../lib/api.js';
import {
  Alert, Badge, Button, Field, Grid, Input, Panel, Spinner,
} from '../../ui/nop/kit.jsx';

const when = (v) => (v ? new Date(v).toLocaleString('en-GB') : '');

const TONE = {
  Paid: 'green', Pending: 'amber', Authorized: 'blue', Refunded: 'slate', Voided: 'slate',
};

export function PaymentStatus() {
  const { orderNumber } = useParams();
  const [status, setStatus] = useState(null);
  const [phone, setPhone] = useState('');
  const [notice, setNotice] = useState(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(() => {
    api.get(`/payments/status/${orderNumber}`)
      .then(setStatus)
      .catch((err) => setStatus({ ok: false, message: err.message ?? 'That order could not be found.' }));
  }, [orderNumber]);
  useEffect(load, [load]);

  const retry = async () => {
    setBusy(true);
    const res = await api.post('/payments/retry', { orderNumber, paymentData: { phone: phone || undefined } })
      .catch((err) => ({ ok: false, message: err.message }));
    setBusy(false);
    if (res.ok !== true) {
      setNotice({ tone: 'warning', text: res.message ?? 'The payment could not be started again.' });
      return;
    }
    setNotice({
      tone: 'info',
      text: res.customerAction ?? 'The payment has been started again. This page shows the result as soon as it arrives.',
    });
    load();
  };

  if (!status) return <Spinner label="Checking your payment" />;
  if (status.ok !== true) {
    return (
      <div className="max-w-xl mx-auto space-y-3">
        <h1 className="nop-page-title">Payment status</h1>
        <Alert tone="warning">{status.message}</Alert>
        <Button as="link" to="/account/orders" variant="brand">My orders</Button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <h1 className="nop-page-title">Payment for order {status.orderNumber}</h1>

      <Panel>
        <div className="flex flex-wrap items-center gap-3">
          <Badge tone={TONE[status.paymentStatus] ?? 'amber'}>{status.paymentStatus}</Badge>
          {status.checkoutReference && (
            <span className="text-[12.5px] text-nop-muted">
              Checkout reference <span className="font-mono">{status.checkoutReference}</span>
            </span>
          )}
        </div>
        {status.message && <p className="text-[13.5px] text-store-text mt-3">{status.message}</p>}
        {status.nextStep && <p className="text-[12.5px] text-nop-muted mt-1">{status.nextStep}</p>}
      </Panel>

      {notice && <Alert tone={notice.tone}>{notice.text}</Alert>}

      {status.retry?.allowed === true ? (
        <Panel title="Try the payment again" subtitle="The order and its reference stay the same.">
          <div className="space-y-3 max-w-sm">
            <Field label="Mobile money number" hint="leave empty to use the number on the order">
              <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="265880000000" />
            </Field>
            <Button variant="brand" onClick={retry} disabled={busy}>
              {busy ? 'Starting the payment' : 'Try again'}
            </Button>
          </div>
        </Panel>
      ) : (
        status.retry?.message && <Alert tone="warning">{status.retry.message}</Alert>
      )}

      <Panel title="Attempts" bodyClass="p-0">
        <Grid
          dense
          columns={[
            { key: 'attemptNo', header: 'Attempt' },
            { key: 'status', header: 'Result', render: (a) => <Badge tone={a.status === 'Successful' ? 'green' : a.status === 'Failed' ? 'red' : 'amber'}>{a.status}</Badge> },
            { key: 'providerRef', header: 'Provider reference', render: (a) => <span className="font-mono text-[12px]">{a.providerRef ?? '-'}</span> },
            { key: 'createdOnUtc', header: 'Started', render: (a) => when(a.createdOnUtc) },
          ]}
          rows={status.attempts}
          rowKey={(a) => `${a.attemptNo}-${a.providerRef ?? ''}`}
          empty="No attempt has been recorded for this order."
        />
      </Panel>

      <Panel title="Need help?">
        {status.supportContact?.value
          ? <p className="text-[13px]">Contact us on {status.supportContact.value} and quote order {status.orderNumber}.</p>
          : (
            <p className="text-[13px] text-nop-muted">
              A support contact has not been set for this shop yet. Quote order {status.orderNumber} when you get in
              touch.
            </p>
          )}
        <div className="mt-3 flex gap-2">
          <Button as="link" to={`/account/orders/${status.orderNumber}`}>Order details</Button>
          <Button as="link" to="/account/orders">My orders</Button>
        </div>
      </Panel>
    </div>
  );
}
