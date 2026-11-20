import Link from 'next/link';
import Image from 'next/image';
import { CartProvider } from '@/components/CartProvider';
import CartFab from '@/components/CartFab';
import { getSettings } from '@/lib/data';

export default async function ShopLayout({ children }) {
  const s = await getSettings();
  return (
    <CartProvider>
      <header className="site-header">
        <Link href="/" className="brand">
          {s.logo_url && <Image src={s.logo_url} alt="" width={36} height={36} className="brand-logo" />}
          <b>{s.shop_name}</b>
        </Link>
      </header>
      <div className="shop">{children}</div>
      <CartFab />
    </CartProvider>
  );
}
