'use client';
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

const Ctx = createContext(null);
export const useCart = () => useContext(Ctx);

// Panier unique, conservé dans le navigateur pendant la navigation.
export function CartProvider({ children }) {
  const [items, setItems] = useState([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try { setItems(JSON.parse(localStorage.getItem('sb_cart') || '[]')); } catch {}
    setReady(true);
  }, []);
  useEffect(() => {
    if (ready) try { localStorage.setItem('sb_cart', JSON.stringify(items)); } catch {}
  }, [items, ready]);

  const add = useCallback((item) => setItems((cur) => {
    const found = cur.find((i) => i.key === item.key);
    return found
      ? cur.map((i) => (i.key === item.key ? { ...i, qty: Math.min(99, i.qty + item.qty) } : i))
      : [...cur, item];
  }), []);
  const setQty = useCallback((key, qty) => setItems((cur) =>
    qty <= 0 ? cur.filter((i) => i.key !== key) : cur.map((i) => (i.key === key ? { ...i, qty: Math.min(99, qty) } : i))), []);
  const remove = useCallback((key) => setItems((cur) => cur.filter((i) => i.key !== key)), []);
  const count = useMemo(() => items.reduce((n, i) => n + i.qty, 0), [items]);

  return <Ctx.Provider value={{ items, add, setQty, remove, count, ready }}>{children}</Ctx.Provider>;
}
