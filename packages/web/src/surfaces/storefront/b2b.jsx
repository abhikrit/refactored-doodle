// The storefront screens a business buyer uses: ordering by product code, saved lists, and the
// orders that wait for a colleague to approve them.
//
// CHK-017 and CHK-018 are both held by the phase decision, so each screen says so plainly.

import React, { useCallback, useEffect, useState } from 'react';
import { api } from '../../lib/api.js';
import { useProduct, money } from '../../lib/store.jsx';
import { AccountLayout } from './account.jsx';
import {
  Alert, Badge, Button, Field, Grid, Input, Panel, Spinner, Textarea,
} from '../../ui/nop/kit.jsx';

export function QuickOrder() {
  const { refreshCart } = useProduct();
  const [text, setText] = useState('');
  const [file, setFile] = useState(null);
  const [result, setResult] = useState(null);
  const [busy, setBusy] = useState(false);

  const send = async (body) => {
    setBusy(true);
    try {
      const res = await api.post('/checkout-area/quick-order', body);
      setResult(res);
      await refreshCart();
    } finally { setBusy(false); }
  };

  return (
    <AccountLayout title="Order by product code">
      <div className="space-y-4">
        <Panel title="Type the codes" subtitle="One line for each item: the product code, a comma, how many.">
          <Textarea
            rows={6}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={'MZC-COF-500, 10\nCHK-LAN-001, 4'}
          />
          <div className="mt-3">
            <Button variant="brand" disabled={busy || !text.trim()} onClick={() => send({ text })}>
              {busy ? 'Adding…' : 'Add to cart'}
            </Button>
          </div>
        </Panel>

        <Panel title="Or upload your own list" subtitle="A file with two columns: the product code and how many.">
          <input
            type="file"
            accept=".csv,.txt"
            className="text-[13px]"
            onChange={async (e) => {
              const chosen = e.target.files?.[0];
              if (!chosen) return;
              setFile({ name: chosen.name, content: await chosen.text() });
            }}
          />
          {file && <p className="mt-2 text-[12.5px] text-nop-muted">{file.name} is ready to add.</p>}
          <div className="mt-3">
            <Button disabled={busy || !file} onClick={() => send({ file })}>Add the file to the cart</Button>
          </div>
        </Panel>

        {result && (
          <>
            {result.added.length > 0 && (
              <Alert tone="success" title={`${result.added.length} item${result.added.length === 1 ? '' : 's'} added`}>
                {result.added.map((a) => `${a.sku} × ${a.quantity}`).join(', ')}
              </Alert>
            )}
            {result.refused.length > 0 && (
              <Panel title="These lines could not be added" bodyClass="p-0">
                <Grid
                  dense
                  columns={[
                    { key: 'sku', header: 'Code' },
                    { key: 'quantity', header: 'How many', align: 'right' },
                    {
                      key: 'why',
                      header: 'Why not',
                      render: (r) => r.message ?? (r.warnings ?? []).join(' '),
                    },
                  ]}
                  rows={result.refused}
                  rowKey={(r) => r.sku}
                />
              </Panel>
            )}
          </>
        )}
      </div>
    </AccountLayout>
  );
}

export function SavedLists() {
  const { refreshCart } = useProduct();
  const [lists, setLists] = useState(null);
  const [name, setName] = useState('');
  const [notice, setNotice] = useState(null);

  const load = useCallback(() => {
    api.get('/checkout-area/saved-lists').then(setLists).catch(() => setLists({ offered: false, lists: [] }));
  }, []);
  useEffect(load, [load]);

  return (
    <AccountLayout title="Saved lists">
      <div className="space-y-4">
        {notice && <Alert tone={notice.tone}>{notice.text}</Alert>}
        {lists && lists.offered === false && (
          <Alert tone="info">Saved lists are not switched on for this shop.</Alert>
        )}

        {lists?.offered && (
          <>
            <Panel title="Save what is in your cart">
              <div className="flex items-end gap-3">
                <Field label="Name this list">
                  <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Monthly order" />
                </Field>
                <Button
                  variant="brand"
                  disabled={!name.trim()}
                  onClick={async () => {
                    const res = await api.post('/checkout-area/saved-lists', { name });
                    setNotice(res.ok === true
                      ? { tone: 'success', text: `${name} is saved.` }
                      : { tone: 'error', text: res.message ?? 'The list was not saved.' });
                    setName('');
                    load();
                  }}
                >
                  Save the list
                </Button>
              </div>
            </Panel>

            <Panel title="Your lists" bodyClass="p-0">
              {!lists ? <Spinner /> : (
                <Grid
                  columns={[
                    { key: 'name', header: 'List' },
                    { key: 'items', header: 'Items', align: 'right' },
                    {
                      key: 'actions',
                      header: '',
                      render: (l) => (
                        <Button
                          size="sm"
                          onClick={async () => {
                            const res = await api.post(`/checkout-area/saved-lists/${l.id}/add-to-cart`, {});
                            await refreshCart();
                            setNotice(res.ok === true
                              ? { tone: 'success', text: `${res.added.length} items from ${l.name} are in your cart.` }
                              : { tone: 'warning', text: `${res.added?.length ?? 0} added, ${res.refused?.length ?? 0} could not be added.` });
                          }}
                        >
                          Add it all to the cart
                        </Button>
                      ),
                    },
                  ]}
                  rows={lists.lists}
                  rowKey={(l) => l.id}
                  empty="You have not saved a list yet."
                />
              )}
            </Panel>
          </>
        )}
      </div>
    </AccountLayout>
  );
}

export function ApprovalRequests() {
  const { customer } = useProduct();
  const [threshold, setThreshold] = useState(null);
  const [mine, setMine] = useState([]);
  const [queue, setQueue] = useState([]);
  const [reason, setReason] = useState({});
  const [notice, setNotice] = useState(null);

  const load = useCallback(async () => {
    api.get('/checkout-area/approval/threshold').then(setThreshold).catch(() => {});
    const requests = await api.get('/checkout-area/approval/requests').catch(() => []);
    setMine((requests ?? []).filter((r) => String(r.requesterEmail) === String(customer?.email)));
    setQueue((requests ?? []).filter((r) => r.status === 'Pending' && String(r.requesterEmail) !== String(customer?.email)));
  }, [customer?.email]);
  useEffect(() => { load(); }, [load]);

  const decide = async (request, decision) => {
    const res = await api.post(`/checkout-area/approval/requests/${request.id}/decision`, {
      decision, reason: reason[request.id] ?? null,
    });
    setNotice(res.ok === true
      ? { tone: 'success', text: `The order was ${decision === 'approve' ? 'approved' : 'rejected'}.` }
      : { tone: 'error', text: res.message ?? 'That decision could not be taken.' });
    load();
  };

  const tone = (status) => ({
    Pending: 'amber', Approved: 'green', Rejected: 'red', Void: 'slate', Expired: 'slate',
  }[status] ?? 'slate');

  return (
    <AccountLayout title="Orders waiting for approval">
      <div className="space-y-4">
        {notice && <Alert tone={notice.tone}>{notice.text}</Alert>}
        {threshold?.threshold != null && (
          <Alert tone="info">
            Orders over {money(threshold.threshold)} need someone at your company to approve them before they can be placed.
          </Alert>
        )}

        <Panel title="Your requests" bodyClass="p-0">
          <Grid
            columns={[
              { key: 'total', header: 'Order value', align: 'right', render: (r) => money(r.total) },
              { key: 'status', header: 'Status', render: (r) => <Badge tone={tone(r.status)}>{r.status}</Badge> },
              { key: 'reason', header: 'Reason given', render: (r) => r.reason ?? '-' },
              { key: 'createdOnUtc', header: 'Asked', render: (r) => new Date(r.createdOnUtc).toLocaleString('en-GB') },
            ]}
            rows={mine}
            rowKey={(r) => r.id}
            empty="You have not asked anybody to approve an order."
          />
        </Panel>

        {queue.length > 0 && (
          <Panel title="Waiting for you" subtitle="Orders your colleagues have asked you to approve.">
            <ul className="divide-y divide-gray-100">
              {queue.map((request) => (
                <li key={request.id} className="py-3">
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="text-[13px] font-medium">{request.requesterEmail}</span>
                    <span className="text-[13px]">{money(request.total)}</span>
                    <Badge tone="amber">{request.status}</Badge>
                  </div>
                  <div className="mt-2 flex flex-wrap items-end gap-2">
                    <Field label="Reason (needed to say no)">
                      <Input
                        value={reason[request.id] ?? ''}
                        onChange={(e) => setReason({ ...reason, [request.id]: e.target.value })}
                      />
                    </Field>
                    <Button size="sm" variant="success" onClick={() => decide(request, 'approve')}>Approve</Button>
                    <Button size="sm" variant="danger" onClick={() => decide(request, 'reject')}>Reject</Button>
                  </div>
                </li>
              ))}
            </ul>
          </Panel>
        )}
      </div>
    </AccountLayout>
  );
}
