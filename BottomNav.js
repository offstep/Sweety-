'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useCart } from './CartProvider';

const I = {
  home: <path d="M3 11l9-8 9 8M5 10v10h5v-6h4v6h5V10" />,
  grid: <path d="M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z" />,
  bag: <path d="M5 8h14l-1 12H6zM9 8V6a3 3 0 016 0v2" />,
  chat: <path d="M4 5h16v11H9l-5 4z" />,
  user: <><circle cx="12" cy="8" r="4" /><path d="M4 21c1-4 4-6 8-6s7 2 8 6" /></>,
};
const Icon = ({ n }) => <svg viewBox="0 0 24 24" aria-hidden="true">{I[n]}</svg>;

export default function BottomNav({ waHref }) {
  const path = usePathname();
  const { count } = useCart();
  const on = (...hrefs) => (hrefs.some((h) => (h === '/' ? path === '/' : path.startsWith(h))) ? 'page' : undefined);
  return (
    <nav className="bnav" aria-label="Navigation principale">
      <Link href="/" aria-current={on('/')}><Icon n="home" />Accueil</Link>
      <Link href="/catalogue" aria-current={on('/catalogue', '/categories', '/produits')}><Icon n="grid" />Catalogue</Link>
      <Link href="/panier" aria-current={on('/panier')}><Icon n="bag" />Panier{count > 0 && <span className="badge">{count}</span>}</Link>
      {waHref && <a href={waHref} className="wa" target="_blank" rel="noopener"><Icon n="chat" />WhatsApp</a>}
      <Link href="/compte" aria-current={on('/compte', '/connexion', '/inscription')}><Icon n="user" />Compte</Link>
    </nav>
  );
}
