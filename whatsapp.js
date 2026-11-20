// Le numéro vient toujours de la table settings (jamais codé en dur).
export const waLink = (number, text) =>
  `https://wa.me/${String(number || '').replace(/\D/g, '')}?text=${encodeURIComponent(text)}`;
