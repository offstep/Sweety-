'use server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { requireAdmin } from '@/lib/auth';
import { slugify, uploadImage } from '@/lib/helpers';

const back = (path, key, msg) => redirect(`${path}?${key}=${encodeURIComponent(msg)}`);

export async function saveProduct(formData) {
  const { supabase } = await requireAdmin();
  const id = formData.get('id') || null;
  const here = id ? `/admin/products/${id}` : '/admin/products/new';

  // Validation côté serveur
  const name = String(formData.get('name') || '').trim();
  const price = Number.parseInt(formData.get('price'), 10);
  const stock = Number.parseInt(formData.get('stock'), 10);
  const threshold = formData.get('low_stock_threshold');
  if (!name) back(here, 'error', 'Le nom est obligatoire.');
  if (!Number.isInteger(price) || price < 0) back(here, 'error', 'Prix invalide.');
  if (!Number.isInteger(stock) || stock < 0) back(here, 'error', 'Stock invalide.');

  const fields = {
    name,
    description: String(formData.get('description') || '').trim() || null,
    price,
    stock,
    category_id: formData.get('category_id') || null,
    video_url: String(formData.get('video_url') || '').trim() || null,
    low_stock_threshold: threshold === '' || threshold === null ? null : Number.parseInt(threshold, 10),
    is_active: formData.get('is_active') === 'on',
    is_popular: formData.get('is_popular') === 'on',
  };

  let productId = id;
  if (id) {
    const { error } = await supabase.from('products').update(fields).eq('id', id);
    if (error) back(here, 'error', error.message);
  } else {
    const { data, error } = await supabase.from('products')
      .insert({ ...fields, slug: slugify(name) }).select('id').single();
    if (error) back(here, 'error', error.message);
    productId = data.id;
  }

  // Photos : plusieurs fichiers, ajoutées à la suite de la galerie existante
  try {
    const files = formData.getAll('images').filter((f) => f && f.size);
    if (files.length) {
      const { count } = await supabase.from('product_images')
        .select('*', { count: 'exact', head: true }).eq('product_id', productId);
      let position = count ?? 0;
      for (const file of files) {
        const url = await uploadImage(supabase, file, `products/${productId}`);
        await supabase.from('product_images').insert({ product_id: productId, url, alt: name, position: position++ });
      }
    }
  } catch (e) {
    back(`/admin/products/${productId}`, 'error', e.message);
  }

  revalidatePath('/admin/products');
  redirect(`/admin/products/${productId}?ok=1`);
}

export async function deleteProduct(formData) {
  const { supabase } = await requireAdmin();
  const { error } = await supabase.from('products').delete().eq('id', formData.get('id'));
  if (error) back('/admin/products', 'error', error.message);
  revalidatePath('/admin/products');
  redirect('/admin/products?ok=1');
}

export async function deleteImage(formData) {
  const { supabase } = await requireAdmin();
  const productId = formData.get('product_id');
  await supabase.from('product_images').delete().eq('id', formData.get('image_id'));
  revalidatePath(`/admin/products/${productId}`);
  redirect(`/admin/products/${productId}`);
}
