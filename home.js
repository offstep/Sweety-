import { sb, $, esc, safe, lnk, img, boot, productCard, CARD_COLS } from './app.js';

const s = await boot('home');
const app = $('#app');
const title = (t) => (t ? `<h2 class="sec-title">${esc(t)}</h2>` : '');
const cta = (c) => (c.button_label && lnk(c.link_url) ? `<a class="btn" href="${esc(lnk(c.link_url))}">${esc(c.button_label)}</a>` : '');
const sec = (inner) => `<section class="float-section">${inner}</section>`;
const products = async (f) => { const { data } = await f(sb.from('products').select(CARD_COLS).eq('is_active', true)); return data ?? []; };
const grid = (t, list, large) => (list.length ? sec(`${title(t)}<div class="pgrid${large ? ' pgrid--large' : ''}">${list.map((p) => productCard(p, s, large)).join('')}</div>`) : '');
const slider = (sx, ratio) => {
  const imgs = (sx.config?.images ?? []).filter((i) => safe(i.url));
  if (!imgs.length) return '';
  return sec(`${title(sx.title)}<div class="carousel">${imgs.map((i) => { const el = img(i.url, ratio, i.alt, 'float-img'); return lnk(i.link) ? `<a href="${esc(lnk(i.link))}">${el}</a>` : `<div>${el}</div>`; }).join('')}</div>`);
};
const hero = (sx) => {
  const c = sx.config ?? {};
  if (!safe(c.image_url)) return `<section class="hero hero--plain float-card">${c.title ? `<h2>${esc(c.title)}</h2>` : ''}${c.subtitle ? `<p>${esc(c.subtitle)}</p>` : ''}${cta(c)}</section>`;
  return `<section class="hero float-card">${img(c.image_url, 'img-frame--banner', c.title)}<div class="hero-cap">${c.title ? `<h2>${esc(c.title)}</h2>` : ''}${c.subtitle ? `<p>${esc(c.subtitle)}</p>` : ''}${cta(c)}</div></section>`;
};
const pill = (sx) => {
  const c = sx.config ?? {}; const t = c.title || c.text; if (!t) return '';
  return lnk(c.link_url) ? `<a class="pill-banner" href="${esc(lnk(c.link_url))}">${esc(t)}</a>` : `<div class="pill-banner">${esc(t)}</div>`;
};

const R = {
  hero_banner: hero,
  custom_banner: (x) => (safe(x.config?.image_url) ? hero(x) : pill(x)),
  image_slider: (x) => slider(x, 'img-frame--wide'),
  carousel: (x) => slider(x, 'img-frame--wide'),
  async categories(x) {
    const { data } = await sb.from('categories').select('id, name, slug, image_url').eq('is_active', true).order('position').order('name');
    if (!data?.length) return '';
    const href = (k) => `catalogue.html?cat=${encodeURIComponent(k.slug)}`;
    return sec(`${title(x.title || 'Catégories')}` + (x.config?.style === 'chips'
      ? `<div class="chips">${data.map((k) => `<a class="chip-link" href="${href(k)}">${esc(k.name)}</a>`).join('')}</div>`
      : `<div class="carousel carousel--cats">${data.map((k) => `<a class="catlink" href="${href(k)}">${img(k.image_url, 'img-frame--square round float-img', k.name)}${esc(k.name)}</a>`).join('')}</div>`));
  },
  async popular(x) { return grid(x.title || 'Produits populaires', await products((q) => q.eq('is_popular', true).order('created_at', { ascending: false }).limit(8)), x.config?.layout === 'large'); },
  async new_arrivals(x) { return grid(x.title || 'Nouveautés', await products((q) => q.order('created_at', { ascending: false }).limit(8)), x.config?.layout === 'large'); },
  async recommendations(x) {
    const l = (await products((q) => q.order('created_at', { ascending: false }).limit(24))).sort(() => Math.random() - 0.5).slice(0, 8);
    return grid(x.title || 'Recommandations', l, x.config?.layout === 'large');
  },
  async promotions(x) {
    const { data } = await sb.from('promotions').select('id, name').eq('is_active', true);
    return data?.length ? sec(`${title(x.title || 'Promotions')}<div class="carousel">${data.map((p) => `<div class="float-card promo-tile"><strong>${esc(p.name)}</strong></div>`).join('')}</div>`) : '';
  },
  async partner_ads(x) {
    const { data } = await sb.from('ads').select('id, business_name, title, description, image_url, cta_label, link_url').eq('is_active', true);
    if (!data?.length) return '';
    return sec(`${title(x.title || 'Nos partenaires')}<div class="carousel">${data.map((a) => `<article class="float-card ad"><small class="ad-tag">Publicité · ${esc(a.business_name)}</small>${img(a.image_url, 'img-frame--wide', a.title)}
      <div class="pcard-body"><strong>${esc(a.title)}</strong><span class="muted">${esc(a.description)}</span></div>
      ${a.cta_label && lnk(a.link_url) ? `<a class="btn btn--ghost ad-btn" href="${esc(lnk(a.link_url))}" target="_blank" rel="noopener sponsored">${esc(a.cta_label)}</a>` : ''}</article>`).join('')}</div>`);
  },
  text_image(x) {
    const c = x.config ?? {};
    return `<section class="float-section textimg">${img(c.image_url, 'img-frame--wide', c.title, 'float-img')}<div>${c.title ? `<h2 class="sec-title">${esc(c.title)}</h2>` : ''}<p class="muted">${esc(c.text)}</p>${cta(c)}</div></section>`;
  },
};

const { data: sections, error } = await sb.from('home_sections').select('*').eq('is_visible', true).order('position');
if (error) app.innerHTML = `<p class="empty">Impossible de charger la boutique.<br><small>${esc(error.message)}</small></p>`;
else if (!sections?.length) app.innerHTML = '<p class="empty">Aucune section n\'est encore configurée.</p>';
else app.innerHTML = (await Promise.all(sections.map((x) => (R[x.type] ? Promise.resolve(R[x.type](x)).catch(() => '') : '')))).join('');
