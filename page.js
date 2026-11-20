import { notFound } from 'next/navigation';
import ProductCard from '@/components/ProductCard';
import { createClient } from '@/lib/supabase/server';
import { getProducts, getSettings } from '@/lib/data';

export default async function CategoryPage({ params }) {
  const { slug } = await params;
  const supabase = await createClient();
  const { data: cat } = await supabase.from('categories').select('id, name').eq('slug', slug).eq('is_active', true).maybeSingle();
  if (!cat) notFound();
  const [products, settings] = await Promise.all([getProducts({ categoryId: cat.id, limit: 60 }), getSettings()]);
  return (
    <section className="float-section">
      <h1 className="sec-title">{cat.name}</h1>
      <div className="pgrid">{products.map((p) => <ProductCard key={p.id} product={p} settings={settings} />)}</div>
      {!products.length && <p className="empty">Aucun produit dans cette catégorie pour le moment.</p>}
    </section>
  );
}
