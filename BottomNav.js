'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useCart } from './CartProvider';

const I = {
  home: <path d="M3 11l9-8 9 8M5 10v10h5v-6h4v6h5V10" />,
  grid: <path d="M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z" />,
  bag: <path d="M5 8h14l-1 12H6zM9 8V6a3 3 0 016 0v2" />,
  chat: <path d="M4 5h16v11H9l-5 4z" />,
};
const Icon = ({ n }) => <svg viewBox="0 0 24 24" aria-hidden="true">{I[n]}</svg>;

export default function BottomNav({ waHref }) {
  const path = usePathname();
  const { count } = useCart();
  const cur = (href) => (href === '/' ? path === '/' : path.startsWith(href)) ? 'page' : undefined;
  return (
    <nav className="bnav" aria-label="Navigation principale">
      <Link href="/" aria-current={cur('/')}><Icon n="home" />Accueil</Link>
      <Link href="/catalogue" aria-current={cur('/catalogue')}><Icon n="grid" />Catalogue</Link>
      <Link href="/panier" aria-current={cur('/panier')}><Icon n="bag" />Panier{count > 0 && <span className="badge">{count}</span>}</Link>
      {waHref && <a href={waHref} className="wa" target="_blank" rel="noopener"><Icon n="chat" />WhatsApp</a>}
    </nav>
  );
}
