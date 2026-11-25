// Socle commun : Supabase, panier, en-tête, barre du bas.
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.45.4/+esm';

const SUPABASE_URL = 'https://prwxezelazbaiifpntne.supabase.co';
const SUPABASE_KEY = 'sb_publishable_Ok6whdEBFqR85ym00CphcQ_QH5EsWqg'; // clé publique
export const sb = createClient(SUPABASE_URL, SUPABASE_KEY);

export const $ = (s, r = document) => r.querySelector(s);
export const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
export const fcfa = (n) => `${Number(n).toLocaleString('fr-FR')} FCFA`;
export const safe = (u) => (/^https?:\/\//i.test(u || '') || /^[\w\-./?=&#%]+$/.test(u || '') ? u : '');
// Les liens saisis en admin (/catalogue, /produits/x…) sont convertis pour GitHub Pages.
export const lnk = (u) => {
  const v = safe(u); if (!v) return '';
  if (/^https?:/i.test(v)) return v;
  let m;
  if ((m = v.match(/^\/?categories\/([^/?#]+)/))) return `catalogue.html?cat=${m[1]}`;
  if ((m = v.match(/^\/?produits\/([^/?#]+)/))) return `produit.html?slug=${m[1]}`;
  const clean = v.replace(/^\//, '');
  return clean === '' ? 'index.html' : /\.\w+/.test(clean) ? clean : `${clean}.html`;
};
export const sortBy = (a, k = 'position') => [...(a || [])].sort((x, y) => (x[k] ?? 0) - (y[k] ?? 0));
export const waLink = (n, t) => `https://wa.me/${String(n || '').replace(/\D/g, '')}?text=${encodeURIComponent(t)}`;
export const normalizePhone = (r) => String(r || '').replace(/\D/g, '');
export const phoneEmail = (d) => `${d}@clients.sweety.app`;   // identifiant technique, jamais affiché

export const img = (src, ratio = '', alt = '', extra = '') =>
  `<div class="img-frame ${ratio} ${extra}">${safe(src) ? `<img src="${esc(src)}" alt="${esc(alt)}" loading="lazy" decoding="async">` : ''}</div>`;

let _settings;
export async function getSettings() {
  if (_settings) return _settings;
  const { data } = await sb.from('settings').select('*').eq('id', 1).maybeSingle();
  return (_settings = data ?? { shop_name: 'Sweety Business', whatsapp_number: '', low_stock_threshold: 5 });
}
export const CARD_COLS = 'id, name, slug, price, stock, low_stock_threshold, product_images(url, position)';
export const cover = (p) => sortBy(p.product_images)[0]?.url;
export const isLow = (p, s) => p.stock <= (p.low_stock_threshold ?? s.low_stock_threshold ?? 5);

export function productCard(p, s, large = false) {
  const low = isLow(p, s);
  return `<a class="float-card pcard" href="produit.html?slug=${encodeURIComponent(p.slug)}">${img(cover(p), large ? '' : 'img-frame--square', p.name)}
    <div class="pcard-body"><strong>${esc(p.name)}</strong><span class="price">${fcfa(p.price)}</span>
    <span class="stock ${low ? 'stock--low' : 'stock--ok'}">${low ? 'Bientôt épuisé' : 'En stock'}</span></div></a>`;
}

// ---------- Panier (conservé dans le navigateur) ----------
export const cart = {
  get() { try { return JSON.parse(localStorage.getItem('sb_cart') || '[]'); } catch { return []; } },
  set(items) { try { localStorage.setItem('sb_cart', JSON.stringify(items)); } catch {} window.dispatchEvent(new Event('sb-cart')); },
  count() { return this.get().reduce((n, i) => n + i.qty, 0); },
  add(item) {
    const items = this.get(); const f = items.find((i) => i.key === item.key);
    if (f) f.qty = Math.min(99, f.qty + item.qty); else items.push(item);
    this.set(items);
  },
  setQty(key, q) { this.set(q <= 0 ? this.get().filter((i) => i.key !== key) : this.get().map((i) => (i.key === key ? { ...i, qty: Math.min(99, q) } : i))); },
};

const svg = (p) => `<svg viewBox="0 0 24 24" aria-hidden="true">${p}</svg>`;
const ICON = {
  bell: svg('<path d="M6 17V11a6 6 0 0112 0v6l2 2H4zM10 21h4"/>'),
  bag: svg('<path d="M5 8h14l-1 12H6zM9 8V6a3 3 0 016 0v2"/>'),
  search: svg('<circle cx="11" cy="11" r="7"/><path d="M20 20l-4-4"/>'),
  home: svg('<path d="M3 11l9-8 9 8M5 10v10h5v-6h4v6h5V10"/>'),
  grid: svg('<path d="M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z"/>'),
  chat: svg('<path d="M4 5h16v11H9l-5 4z"/>'),
  user: svg('<circle cx="12" cy="8" r="4"/><path d="M4 21c1-4 4-6 8-6s7 2 8 6"/>'),
};

export async function boot(active) {
  const s = await getSettings();
  document.title = s.shop_name;
  const main = $('#app');
  const header = document.createElement('header');
  header.className = 'site-header';
  header.innerHTML = `<a class="icon-btn" href="notifications.html" aria-label="Notifications">${ICON.bell}<span class="badge" id="bell-n" hidden></span></a>
    <a class="brand" href="index.html">${safe(s.logo_url) ? `<img class="brand-logo" src="${esc(s.logo_url)}" alt="" width="36" height="36">` : ''}<b>${esc(s.shop_name)}</b></a>
    <a class="icon-btn" href="panier.html" aria-label="Panier">${ICON.bag}<span class="badge" id="bag-n" hidden></span></a>`;
  const search = document.createElement('div');
  search.className = 'shop shop-top';
  search.innerHTML = `<form class="search search--top" action="catalogue.html" role="search">
    <input name="q" placeholder="Rechercher un produit" aria-label="Rechercher un produit">
    <button class="btn search-go" type="submit" aria-label="Lancer la recherche">${ICON.search}</button></form>`;
  const cur = (k) => (k === active ? ' aria-current="page"' : '');
  const nav = document.createElement('nav');
  nav.className = 'bnav'; nav.setAttribute('aria-label', 'Navigation principale');
  nav.innerHTML = `<a href="index.html"${cur('home')}>${ICON.home}Accueil</a>
    <a href="catalogue.html"${cur('catalogue')}>${ICON.grid}Catalogue</a>
    <a href="panier.html"${cur('panier')}>${ICON.bag}Panier<span class="badge" id="bag-n2" hidden></span></a>
    ${s.whatsapp_number ? `<a class="wa" href="${waLink(s.whatsapp_number, `Bonjour ${s.shop_name}, j'ai une question.`)}" target="_blank" rel="noopener">${ICON.chat}WhatsApp</a>` : ''}
    <a href="compte.html"${cur('compte')}>${ICON.user}Compte</a>`;
  main.before(header, search);
  document.body.append(nav);

  const paint = () => {
    const n = cart.count();
    for (const id of ['#bag-n', '#bag-n2']) { const el = $(id); el.hidden = !n; el.textContent = n; }
  };
  paint(); window.addEventListener('sb-cart', paint);

  const { data: notifs } = await sb.from('notifications').select('created_at').eq('is_active', true).order('created_at', { ascending: false }).limit(30);
  let seen = ''; try { seen = localStorage.getItem('sb_notif_seen') || ''; } catch {}
  const unread = (notifs || []).filter((x) => !seen || new Date(x.created_at) > new Date(seen)).length;
  const b = $('#bell-n'); b.hidden = !unread; b.textContent = unread;
  return s;
}
