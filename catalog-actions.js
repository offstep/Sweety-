'use server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { requireAdmin } from '@/lib/auth';
import { uploadImage } from '@/lib/helpers';

const text = (fd, k) => String(fd.get(k) || '').trim();

async function finish(fd, error) {
  const id = text(fd, 'product_id');
  revalidatePath(`/admin/products/${id}`);
  redirect(`/admin/products/${id}${error ? `?error=${encodeURIComponent(error.message ?? error)}` : ''}#catalogue`);
}

// ---------- Variantes ----------
export async function addOptionType(fd) {
  const { supabase } = await requireAdmin();
  const name = text(fd, 'name');
  if (!name) return finish(fd, 'Le nom de la variante est obligatoire.');
  const kind = ['color', 'button', 'select'].includes(text(fd, 'kind')) ? text(fd, 'kind') : 'button';
  const { error } = await supabase.from('option_types').insert({ product_id: text(fd, 'product_id'), name, kind });
  return finish(fd, error);
}

export async function deleteOptionType(fd) {
  const { supabase } = await requireAdmin();
  const { error } = await supabase.from('option_types').delete().eq('id', text(fd, 'id'));
  return finish(fd, error);
}

export async function addOptionValue(fd) {
  const { supabase } = await requireAdmin();
  const label = text(fd, 'label');
  if (!label) return finish(fd, 'Le nom de la valeur est obligatoire.');
  const color = text(fd, 'color_hex');
  const { error } = await supabase.from('option_values').insert({
    option_type_id: text(fd, 'option_type_id'),
    label,
    color_hex: /^#[0-9a-f]{6}$/i.test(color) ? color : null,
    image_id: text(fd, 'image_id') || null,   // photo affichée quand le client choisit cette valeur
  });
  return finish(fd, error);
}

export async function deleteOptionValue(fd) {
  const { supabase } = await requireAdmin();
  const { error } = await supabase.from('option_values').delete().eq('id', text(fd, 'id'));
  return finish(fd, error);
}

// ---------- Suppléments ----------
export async function addSupplement(fd) {
  const { supabase } = await requireAdmin();
  const name = text(fd, 'name');
  const price = Number.parseInt(fd.get('price'), 10);
  if (!name) return finish(fd, 'Le nom du supplément est obligatoire.');
  if (!Number.isInteger(price) || price < 0) return finish(fd, 'Prix du supplément invalide.');
  let image_url = null;
  try { image_url = await uploadImage(supabase, fd.get('image'), 'supplements'); }
  catch (e) { return finish(fd, e); }
  const { error } = await supabase.from('supplements').insert({
    product_id: text(fd, 'product_id'), name, price, image_url,
    description: text(fd, 'description') || null,
    is_required: fd.get('is_required') === 'on',
  });
  return finish(fd, error);
}

export async function deleteSupplement(fd) {
  const { supabase } = await requireAdmin();
  const { error } = await supabase.from('supplements').delete().eq('id', text(fd, 'id'));
  return finish(fd, error);
}

export async function addSupplementOption(fd) {
  const { supabase } = await requireAdmin();
  const name = text(fd, 'name');
  const values = text(fd, 'values').split(',').map((v) => v.trim()).filter(Boolean);
  if (!name || !values.length) return finish(fd, 'Indique un nom et au moins une valeur (séparées par des virgules).');
  const { error } = await supabase.from('supplement_option_types')
    .insert({ supplement_id: text(fd, 'supplement_id'), name, values });
  return finish(fd, error);
}

export async function deleteSupplementOption(fd) {
  const { supabase } = await requireAdmin();
  const { error } = await supabase.from('supplement_option_types').delete().eq('id', text(fd, 'id'));
  return finish(fd, error);
}
