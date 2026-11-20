import { createClient } from './supabase/server';

export async function getSettings() {
  const supabase = await createClient();
  const { data } = await supabase.from('settings').select('*').eq('id', 1).maybeSingle();
  return data ?? { shop_name: 'Sweety Business', whatsapp_number: '', low_stock_threshold: 5, currency: 'FCFA' };
}

const CARD = 'id, name, slug, price, stock, low_stock_threshold, product_images(url, position)';

export async function getProducts({ categoryId, popular, limit = 8, excludeId } = {}) {
  const supabase = await createClient();
  let q = supabase.from('products').select(CARD).eq('is_active', true)
    .order('created_at', { ascending: false }).limit(limit);
  if (categoryId) q = q.eq('category_id', categoryId);
  if (popular) q = q.eq('is_popular', true);
  if (excludeId) q = q.neq('id', excludeId);
  const { data } = await q;
  return data ?? [];
}

export const cover = (p) =>
  [...(p.product_images ?? [])].sort((a, b) => a.position - b.position)[0]?.url;

// « Bientôt épuisé » : seuil du produit, sinon seuil global. Jamais de quantité exacte.
export const isLow = (p, settings) => p.stock <= (p.low_stock_threshold ?? settings.low_stock_threshold ?? 5);
