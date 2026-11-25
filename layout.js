import Link from 'next/link';
import Image from 'next/image';
import { CartProvider } from '@/components/CartProvider';
import CartFab from '@/components/CartFab';
import BottomNav from '@/components/BottomNav';
import { BellButton, BagButton } from '@/components/HeaderActions';
import { getSettings } from '@/lib/data';
import { createClient } from '@/lib/supabase/server';
import { waLink } from '@/lib/whatsapp';

export default async function ShopLayout({ children }) {
  const s = await getSettings();
  const supabase = await createClient();
  const { data: notifs } = await supabase.from('notifications').select('created_at').eq('is_active', true)
    .order('created_at', { ascending: false }).limit(30);
  const waHref = s.whatsapp_number ? waLink(s.whatsapp_number, `Bonjour ${s.shop_name}, j'ai une question.`) : null;
  return (
    <CartProvider>
      <header className="site-header">
        <BellButton dates={(notifs ?? []).map((n) => n.created_at)} />
        <Link href="/" className="brand">
          {s.logo_url && <Image src={s.logo_url} alt="" width={36} height={36} className="brand-logo" />}
          <b>{s.shop_name}</b>
        </Link>
        <BagButton />
      </header>
      <div className="shop">
        <form className="search search--top" action="/catalogue" role="search">
          <input name="q" placeholder="Rechercher un produit" aria-label="Rechercher un produit" />
          <button className="btn search-go" type="submit" aria-label="Lancer la recherche">
            <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7" /><path d="M20 20l-4-4" /></svg>
          </button>
        </form>
        {children}
      </div>
      <CartFab />
      <BottomNav waHref={waHref} />
    </CartProvider>
  );
}
