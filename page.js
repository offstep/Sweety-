import Link from 'next/link';
import ProductCard from '@/components/ProductCard';
import { createClient } from '@/lib/supabase/server';
import { getSettings } from '@/lib/data';

export default async function Catalogue({ searchParams }) {
  const { q = '' } = await searchParams;
  const term = q.replace(/[%_,()]/g, ' ').trim().slice(0, 60);
  const supabase = await createClient();
  let query = supabase.from('products')
    .select('id, name, slug, price, stock, low_stock_threshold, product_images(url, position)')
    .eq('is_active', true).order('created_at', { ascending: false }).limit(60);
  if (term) query = query.ilike('name', `%${term}%`);
  const [{ data: products }, { data: cats }, settings] = await Promise.all([
    query,
    supabase.from('categories').select('id, name, slug').eq('is_active', true).order('position').order('name'),
    getSettings(),
  ]);
  return (
    <section className="float-section">
      <h1 className="sec-title">Catalogue</h1>
      <form className="search" action="/catalogue">
        <input name="q" defaultValue={term} placeholder="Rechercher un produit" aria-label="Rechercher" />
        <button className="btn" type="submit">Chercher</button>
      </form>
      {!!cats?.length && <div className="chips">{cats.map((c) => <Link key={c.id} href={`/categories/${c.slug}`} className="chip-link">{c.name}</Link>)}</div>}
      <div className="pgrid">{(products ?? []).map((p) => <ProductCard key={p.id} product={p} settings={settings} />)}</div>
      {!products?.length && <p className="empty">{term ? 'Aucun produit ne correspond à votre recherche.' : 'Aucun produit pour le moment.'}</p>}
    </section>
  );
}
