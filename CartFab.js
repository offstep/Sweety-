'use client';
import Link from 'next/link';
import { useCart } from './CartProvider';

export default function CartFab() {
  const { count } = useCart();
  return (
    <Link href="/panier" className="btn cart-fab" aria-label={`Panier, ${count} article(s)`}>
      Panier{count > 0 && <span className="badge">{count}</span>}
    </Link>
  );
}
