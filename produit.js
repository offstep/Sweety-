import { sb, $, esc, safe, fcfa, img, boot, cart, waLink, sortBy, isLow, productCard, CARD_COLS } from './app.js';

const s = await boot('catalogue');
const app = $('#app');
const slug = new URLSearchParams(location.search).get('slug');

const { data: p } = await sb.from('products')
  .select('*, product_images(*), option_types(*, option_values(*)), supplements(*, supplement_option_types(*))')
  .eq('slug', slug || '').eq('is_active', true).maybeSingle();

if (!p) {
  app.innerHTML = '<p class="empty">Produit introuvable.</p>';
} else {
  const images = sortBy(p.product_images);
  const types = sortBy(p.option_types).map((t) => ({ ...t, values: sortBy(t.option_values) }));
  const sups = (p.supplements || []).filter((x) => x.is_active !== false);
  const sel = {};                                   // typeId -> valueId
  const supSel = {};                                // supId -> { on, opts }
  sups.forEach((x) => { supSel[x.id] = { on: !!x.is_required, opts: {} }; });
  let qty = 1, idx = 0, msg = '';
  const low = isLow(p, s);
  const inStock = p.stock > 0;

  const chosen = () => types.map((t) => ({ name: t.name, label: t.values.find((v) => v.id === sel[t.id])?.label })).filter((o) => o.label);
  const chosenSups = () => sups.filter((x) => supSel[x.id].on).map((x) => ({
    id: x.id, name: x.name, price: x.price,
    options: Object.fromEntries((x.supplement_option_types || []).map((o) => [o.name, supSel[x.id].opts[o.id]]).filter(([, v]) => v)),
  }));
  const problem = () => {
    if (!inStock) return 'Ce produit est bientôt épuisé.';
    const t = types.find((t) => !sel[t.id]); if (t) return `Choisis : ${t.name}`;
    for (const x of sups.filter((x) => supSel[x.id].on)) {
      const o = (x.supplement_option_types || []).find((o) => !supSel[x.id].opts[o.id]);
      if (o) return `${x.name} : choisis ${o.name}`;
    }
    return '';
  };
  const supPerUnit = () => chosenSups().reduce((n, x) => n + x.price, 0);
  const message = () => {
    const o = chosen().map((x) => `${x.name} : ${x.label}`).join(', ');
    const su = chosenSups().map((x) => `${x.name}${Object.values(x.options).length ? ` (${Object.values(x.options).join(', ')})` : ''} +${fcfa(x.price)}`).join('\n  ');
    return `Bonjour, je souhaite commander :\n• ${p.name} — ${fcfa(p.price)}${o ? `\nVariantes : ${o}` : ''}${su ? `\nSuppléments :\n  ${su}` : ''}\nQuantité : ${qty}\nTotal : ${fcfa((p.price + supPerUnit()) * qty)}\nLien : ${location.href}`;
  };

  const video = () => {
    if (!safe(p.video_url)) return '';
    return /\.(mp4|webm)(\?|$)/i.test(p.video_url)
      ? `<video class="vid" controls preload="none" playsinline src="${esc(p.video_url)}"></video>`
      : `<a class="btn btn--ghost" style="margin-top:12px" href="${esc(p.video_url)}" target="_blank" rel="noopener">Voir la vidéo</a>`;
  };

  function draw() {
    const err = problem();
    app.innerHTML = `<section class="float-section">
      ${img(images[idx]?.url, '', p.name, 'float-img')}
      ${images.length > 1 ? `<div class="thumbs">${images.map((im, i) => `<button data-thumb="${i}" aria-pressed="${i === idx}" aria-label="Photo ${i + 1}">${img(im.url, 'img-frame--square', '')}</button>`).join('')}</div>` : ''}
      ${video()}
      <h1 class="sec-title" style="margin-top:18px">${esc(p.name)}</h1>
      <div class="price big-price">${fcfa(p.price)}</div>
      <div class="stock ${low ? 'stock--low' : 'stock--ok'}">${low ? 'Bientôt épuisé' : 'En stock'}</div>
      ${p.description ? `<p style="white-space:pre-line">${esc(p.description)}</p>` : ''}
      ${types.map((t) => `<div class="field"><span>${esc(t.name)}</span>${t.kind === 'select'
        ? `<select data-select="${t.id}"><option value="">Choisir</option>${t.values.map((v) => `<option value="${v.id}" ${sel[t.id] === v.id ? 'selected' : ''}>${esc(v.label)}</option>`).join('')}</select>`
        : `<div class="opts">${t.values.map((v) => `<button class="opt" data-type="${t.id}" data-value="${v.id}" aria-pressed="${sel[t.id] === v.id}">${v.color_hex ? `<i class="dot" style="background:${esc(v.color_hex)}"></i>` : ''}${esc(v.label)}</button>`).join('')}</div>`}</div>`).join('')}
      ${sups.length ? '<h2 class="sec-title" style="margin-top:22px">Suppléments</h2>' : ''}
      ${sups.map((x) => `<div class="float-card sup">${img(x.image_url, 'img-frame--square', x.name)}<div>
        <label><input type="checkbox" data-sup="${x.id}" ${supSel[x.id].on ? 'checked' : ''} ${x.is_required ? 'disabled' : ''}> ${esc(x.name)} <span class="price">+${fcfa(x.price)}</span></label>
        ${x.description ? `<small class="muted">${esc(x.description)}</small>` : ''}
        ${supSel[x.id].on ? (x.supplement_option_types || []).map((o) => `<div class="field"><span>${esc(o.name)}</span><select data-supopt="${x.id}|${o.id}"><option value="">Choisir</option>${(o.values || []).map((v) => `<option ${supSel[x.id].opts[o.id] === v ? 'selected' : ''}>${esc(v)}</option>`).join('')}</select></div>`).join('') : ''}
      </div></div>`).join('')}
      <div class="field"><span>Quantité</span><div class="qty"><button data-q="-1" aria-label="Moins">−</button><b>${qty}</b><button data-q="1" aria-label="Plus">+</button></div></div>
      <div class="price big-price">Total : ${fcfa((p.price + supPerUnit()) * qty)}</div>
      ${err ? `<p class="muted">${esc(err)}</p>` : ''}
      <div class="actions">
        <button class="btn" id="add" ${err ? 'disabled' : ''}>Ajouter au panier</button>
        ${s.whatsapp_number ? `<a class="btn wa" id="wa" href="${waLink(s.whatsapp_number, message())}" target="_blank" rel="noopener">Contacter sur WhatsApp</a>` : ''}
        ${navigator.canShare ? '<button class="btn btn--ghost" id="share">Envoyer avec la photo</button>' : ''}
      </div>
      <div class="toast" id="toast" hidden></div>
    </section><div id="reco"></div>`;
  }
  draw();

  app.addEventListener('click', async (e) => {
    const b = e.target.closest('button,a'); if (!b) return;
    if (b.dataset.thumb) { idx = +b.dataset.thumb; draw(); }
    else if (b.dataset.type) {
      sel[b.dataset.type] = b.dataset.value;
      const v = types.flatMap((t) => t.values).find((v) => v.id === b.dataset.value);
      const i = images.findIndex((im) => im.id === v?.image_id);   // l'image suit la couleur choisie
      if (i >= 0) idx = i;
      draw();
    } else if (b.dataset.q) { qty = Math.min(99, Math.max(1, qty + +b.dataset.q)); draw(); }
    else if (b.id === 'add' && !problem()) {
      const options = Object.fromEntries(chosen().map((o) => [o.name, o.label]));
      const supplements = chosenSups();
      cart.add({ key: JSON.stringify([p.id, options, supplements]), productId: p.id, slug: p.slug, name: p.name, image: images[0]?.url || '',
        unitPrice: p.price, supplementsPerUnit: supPerUnit(), qty, options, supplements });
      const t = $('#toast'); t.hidden = false; t.innerHTML = 'Ajouté au panier. <a class="link" href="panier.html">Voir le panier</a>';
    } else if (b.id === 'share') {
      e.preventDefault();
      try {
        const blob = await (await fetch(images[idx].url)).blob();
        const file = new File([blob], 'produit.jpg', { type: blob.type });
        if (navigator.canShare({ files: [file] })) { await navigator.share({ files: [file], text: message() }); return; }
      } catch {}
      window.open(waLink(s.whatsapp_number, message()), '_blank');
    }
  });
  app.addEventListener('change', (e) => {
    const t = e.target;
    if (t.dataset.select !== undefined) { sel[t.dataset.select] = t.value; const v = types.flatMap((x) => x.values).find((v) => v.id === t.value); const i = images.findIndex((im) => im.id === v?.image_id); if (i >= 0) idx = i; draw(); }
    else if (t.dataset.sup) { supSel[t.dataset.sup].on = t.checked; draw(); }
    else if (t.dataset.supopt) { const [a, o] = t.dataset.supopt.split('|'); supSel[a].opts[o] = t.value; draw(); }
  });

  // Recommandations
  let rq = sb.from('products').select(CARD_COLS).eq('is_active', true).neq('id', p.id).order('created_at', { ascending: false }).limit(8);
  if (p.category_id) rq = rq.eq('category_id', p.category_id);
  const { data: recos } = await rq;
  if (recos?.length) $('#reco').innerHTML = `<section class="float-section"><h2 class="sec-title">Recommandations</h2><div class="carousel">${recos.map((r) => productCard(r, s)).join('')}</div></section>`;
}
