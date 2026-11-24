// Prototype-wide state: the active client pack, the signed-in customer, the cart and the
// PRD registry. Everything the UI shows about the product comes from the registry, which is
// generated from /docs - the UI never hard-codes a requirement, a feature name or a count.

import React, {
  createContext, useCallback, useContext, useEffect, useMemo, useState,
} from 'react';
import { api } from './api.js';

const Ctx = createContext(null);

export function ProductProvider({ children }) {
  const [meta, setMeta] = useState(null);
  const [clients, setClients] = useState([]);
  const [packReport, setPackReport] = useState(null);
  const [customer, setCustomer] = useState(null);
  const [cart, setCart] = useState(null);
  const [areas, setAreas] = useState([]);
  const [features, setFeatures] = useState([]);
  const [screens, setScreens] = useState([]);
  const [roles, setRoles] = useState([]);
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState(null);

  const loadClientState = useCallback(async () => {
    const [m, report, me, c] = await Promise.all([
      api.get('/meta'),
      api.get('/platform/packs/report'),
      api.get('/identity/me'),
      api.get('/checkout-area/cart'),
    ]);
    setMeta(m);
    setPackReport(report);
    setCustomer(me);
    setCart(c);
    const brand = report?.content?.brand;
    if (brand) {
      document.documentElement.style.setProperty('--brand', brand.primary);
      document.documentElement.style.setProperty('--brand-accent', brand.accent);
    }
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const [cl, ar, fe, sc, ro] = await Promise.all([
          api.get('/platform/clients'),
          api.get('/areas'),
          api.get('/registry/features'),
          api.get('/registry/screens'),
          api.get('/roles'),
        ]);
        setClients(cl);
        setAreas(ar);
        setFeatures(fe);
        setScreens(sc);
        setRoles(ro);
        await loadClientState();
      } catch (err) {
        setError(err.message);
      } finally {
        setBusy(false);
      }
    })();
  }, [loadClientState]);

  const switchClient = useCallback(async (clientId) => {
    setBusy(true);
    try {
      await api.post('/platform/packs/apply', { clientId, storeId: 1 });
      const ar = await api.get('/areas');
      setAreas(ar);
      await loadClientState();
    } finally {
      setBusy(false);
    }
  }, [loadClientState]);

  const refreshCart = useCallback(async () => {
    setCart(await api.get('/checkout-area/cart'));
  }, []);

  const refreshCustomer = useCallback(async () => {
    setCustomer(await api.get('/identity/me'));
  }, []);

  const value = useMemo(() => ({
    meta,
    clients,
    packReport,
    client: packReport?.client ?? meta?.client?.id ?? null,
    content: packReport?.content ?? {},
    entities: packReport?.entities ?? {},
    settings: (key, fallback) => {
      const row = packReport?.keys?.find((k) => k.key === key);
      return row ? row.value : fallback;
    },
    customer,
    cart,
    areas,
    features,
    screens,
    roles,
    busy,
    error,
    switchClient,
    refreshCart,
    refreshCustomer,
    setCart,
  }), [meta, clients, packReport, customer, cart, areas, features, screens, roles, busy, error,
    switchClient, refreshCart, refreshCustomer]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useProduct() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useProduct must be used inside ProductProvider');
  return ctx;
}

export function money(amount, currency) {
  if (amount === null || amount === undefined) return '-';
  const code = currency ?? 'USD';
  try {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency', currency: code, maximumFractionDigits: code === 'MWK' ? 0 : 2,
    }).format(amount);
  } catch {
    return `${code} ${Number(amount).toFixed(2)}`;
  }
}
