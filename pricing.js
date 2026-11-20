// Calcul des promotions et des totaux. Fonction pure : utilisée pour l'affichage du panier
// et RÉUTILISÉE côté serveur au paiement (phase 5), qui reste la seule source de vérité.
import { fcfa } from './helpers';

const valid = (p, now = Date.now()) =>
  p.is_active && (!p.starts_at || new Date(p.starts_at) <= now) && (!p.ends_at || new Date(p.ends_at) >= now);

export const lineTotal = (l) => (l.unitPrice + l.supplementsPerUnit) * l.qty;

export function describePromo(p) {
  if (p.type === 'free_shipping') return 'la livraison gratuite';
  if (p.type === 'gift') return 'votre cadeau';
  return `-${p.discount_percent} %`;
}

export function computePricing({ lines, promotions, deliveryFee = 0 }) {
  const sum = (arr, f) => arr.reduce((s, x) => s + f(x), 0);
  const subtotal = sum(lines, lineTotal);

  const evals = promotions.filter((p) => valid(p)).map((p) => {
    const eligible = p.applies_to_all ? lines : lines.filter((l) => p.product_ids?.includes(l.productId));
    const qty = sum(eligible, (l) => l.qty);
    const amount = sum(eligible, lineTotal);
    const metric = p.threshold_kind === 'quantity' ? qty : amount;
    return { p, metric, amount, met: lines.length > 0 && metric >= p.threshold };
  });

  const met = evals.filter((e) => e.met);
  const discounts = met.filter((e) => e.p.type === 'quantity_discount' || e.p.type === 'amount_discount')
    .map((e) => ({ ...e, value: Math.round((e.amount * e.p.discount_percent) / 100) }))
    .sort((a, b) => b.value - a.value);
  const best = discounts[0];                        // une seule réduction : la plus avantageuse
  const freeShipping = met.some((e) => e.p.type === 'free_shipping');
  const gifts = met.filter((e) => e.p.type === 'gift').map((e) => e.p);

  const unmet = evals.filter((e) => !e.met && lines.length > 0)
    .sort((a, b) => (a.p.threshold - a.metric) / a.p.threshold - (b.p.threshold - b.metric) / b.p.threshold)[0];

  const discount = best?.value ?? 0;
  const delivery = freeShipping ? 0 : deliveryFee;
  return {
    subtotal, discount, discountPromo: best?.p ?? null, freeShipping, gifts, delivery,
    total: Math.max(0, subtotal - discount) + delivery,
    hasAutoPromo: met.length > 0,                   // si vrai : champ code promo masqué
    next: unmet ? { promo: unmet.p, missing: unmet.p.threshold - unmet.metric, kind: unmet.p.threshold_kind } : null,
  };
}

export function nextPromoText(next) {
  if (!next) return '';
  const what = describePromo(next.promo);
  return next.kind === 'quantity'
    ? `Encore ${next.missing} article${next.missing > 1 ? 's' : ''} pour obtenir ${what}.`
    : `Plus que ${fcfa(next.missing)} pour obtenir ${what}.`;
}
