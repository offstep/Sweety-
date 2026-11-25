import { sb, $, esc, fcfa, img, boot, cart, waLink } from './app.js';
import { computePricing, nextPromoText, lineTotal } from './pricing.js';

const s = await boot('panier');
const app = $('#app');

const { data: promoRows } = await sb.from('promotions').select('*, promotion_products(product_id)').eq('is_active', true);
const promotions = (promoRows ?? []).map((p) => ({ ...p, product_ids: (p.promotion_products ?? []).map((x) => x.product_id) }));

function draw() {
  const items = cart.get();
  if (!items.length) {
    app.innerHTML = '<section class="float-section"><h1 class="sec-title">Panier</h1><p class="empty">Ton panier est vide.</p><a class="btn" href="catalogue.html">Découvrir les produits</a></section>';
    return;
  }
  const t = computePricing({ lines: items, promotions });
  const msg = [
    'Bonjour, je souhaite passer cette commande :',
    ...items.map((i) => {
      const o = Object.entries(i.options || {}).map(([k, v]) => `${k} : ${v}`).join(', ');
      const su = (i.supplements || []).map((x) => `${x.name}${Object.values(x.options || {}).length ? ` (${Object.values(x.options).join(', ')})` : ''} +${fcfa(x.price)}`).join(', ');
      return `• ${i.qty} × ${i.name} — ${fcfa(i.unitPrice)}${o ? ` [${o}]` : ''}${su ? ` + ${su}` : ''}`;
    }),
    `Sous-total : ${fcfa(t.subtotal)}`,
    ...(t.discount ? [`Réduction : -${fcfa(t.discount)}`] : []),
    ...(t.freeShipping ? ['Livraison offerte'] : []),
    ...t.gifts.map((g) => `Cadeau : ${g.name}`),
    `Total (hors livraison) : ${fcfa(t.total)}`,
  ].join('\n');

  app.innerHTML = `<section class="float-section"><h1 class="sec-title">Panier</h1>
    ${t.next ? `<div class="notice">${esc(nextPromoText(t.next))}<a class="btn" href="catalogue.html">Découvrir les produits</a></div>` : ''}
    ${items.map((i) => {
      const o = Object.entries(i.options || {}).map(([k, v]) => `${esc(k)} : ${esc(v)}`).join(' · ');
      return `<article class="float-card line">${img(i.image, 'img-frame--square', i.name)}<div>
        <strong>${esc(i.name)}</strong><span class="price"> ${fcfa(i.unitPrice)}</span>
        ${o ? `<small>${o}</small>` : ''}
        ${(i.supplements || []).map((x) => `<small>+ ${esc(x.name)}${Object.values(x.options || {}).length ? ` (${esc(Object.values(x.options).join(', '))})` : ''} · ${fcfa(x.price)}</small>`).join('')}
        <div class="qty" style="margin-top:10px"><button data-q="${esc(i.key)}" data-d="-1" aria-label="Moins">−</button><b>${i.qty}</b><button data-q="${esc(i.key)}" data-d="1" aria-label="Plus">+</button>
        <button class="link-danger" data-del="${esc(i.key)}" style="margin-left:auto;background:none;width:auto;box-shadow:none;font-size:14px;color:var(--red)">Supprimer</button></div>
      </div></article>`;
    }).join('')}
    ${t.hasAutoPromo ? '' : `<label class="field">Code promo<input name="code" id="code" placeholder="Saisis ton code" style="min-height:48px;padding:0 14px;border:1px solid var(--line);border-radius:14px;font:500 16px var(--font)"><small class="muted">Le code est confirmé par la vendeuse avec ta commande.</small></label>`}
    <div class="totals">
      <div><span>Sous-total</span><span>${fcfa(t.subtotal)}</span></div>
      ${t.discount ? `<div><span>Réduction (${esc(t.discountPromo.name)})</span><span>-${fcfa(t.discount)}</span></div>` : ''}
      ${t.gifts.map((g) => `<div><span>Cadeau offert</span><span>${esc(g.name)}</span></div>`).join('')}
      <div><span>Livraison</span><span>${t.freeShipping ? 'Offerte' : 'Calculée à la commande'}</span></div>
      <div class="grand"><span>Total</span><span>${fcfa(t.total)}</span></div>
    </div>
    <div class="actions">
      <a class="btn wa" id="order" href="#" target="_blank" rel="noopener">Commander sur WhatsApp</a>
      <button class="btn" disabled>Payer en ligne (bientôt disponible)</button>
    </div></section>`;

  $('#order').onclick = (e) => {
    e.preventDefault();
    const code = ($('#code')?.value || '').trim();
    if (!s.whatsapp_number) return alert("Le numéro WhatsApp de la boutique n'est pas encore configuré.");
    window.open(waLink(s.whatsapp_number, `${msg}${code ? `\nCode promo : ${code}` : ''}`), '_blank');
  };
}

app.addEventListener('click', (e) => {
  const b = e.target.closest('button'); if (!b) return;
  if (b.dataset.q) { const i = cart.get().find((x) => x.key === b.dataset.q); if (i) { cart.setQty(i.key, i.qty + +b.dataset.d); draw(); } }
  else if (b.dataset.del) { cart.setQty(b.dataset.del, 0); draw(); }
});
draw();
