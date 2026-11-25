import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { isValidPhone, normalizePhone, phoneEmail } from '@/lib/phone';

async function signUp(formData) {
  'use server';
  const name = String(formData.get('name') || '').trim().slice(0, 120);
  const phone = normalizePhone(formData.get('phone'));
  const password = String(formData.get('password') || '');
  if (name.length < 2) redirect('/inscription?error=nom');
  if (!isValidPhone(phone)) redirect('/inscription?error=telephone');
  if (password.length < 8) redirect('/inscription?error=mdp');
  if (password !== String(formData.get('confirm') || '')) redirect('/inscription?error=confirm');

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email: phoneEmail(phone), password, options: { data: { full_name: name, phone } },
  });
  if (error) redirect(`/inscription?error=${/registered|exists/i.test(error.message) ? 'existe' : 'echec'}`);
  if (!data.session) redirect('/inscription?error=confirmation');
  redirect('/compte');
}

const ERR = {
  nom: 'Indique ton nom complet.', telephone: 'Numéro de téléphone invalide.',
  mdp: 'Le mot de passe doit faire au moins 8 caractères.', confirm: 'Les mots de passe ne correspondent pas.',
  existe: 'Un compte existe déjà avec ce numéro. Connecte-toi.',
  confirmation: "Inscription enregistrée mais la confirmation par e-mail est encore activée dans Supabase : désactive « Confirm email » (Authentication > Providers > Email).",
  echec: "L'inscription a échoué. Réessaie dans un instant.",
};

export default async function Inscription({ searchParams }) {
  const { error } = await searchParams;
  return (
    <form action={signUp} className="float-section auth">
      <h1 className="sec-title">Créer un compte</h1>
      {error && <p className="msg msg--err">{ERR[error] ?? ERR.echec}</p>}
      <label>Nom complet<input name="name" required autoComplete="name" /></label>
      <label>Numéro de téléphone<input name="phone" type="tel" inputMode="tel" required autoComplete="tel" placeholder="07 00 00 00 00" /></label>
      <label>Mot de passe<input name="password" type="password" minLength={8} required autoComplete="new-password" /></label>
      <label>Confirmer le mot de passe<input name="confirm" type="password" minLength={8} required autoComplete="new-password" /></label>
      <button className="btn" type="submit">S'inscrire</button>
      <p className="muted">Déjà un compte ? <Link href="/connexion" className="link">Se connecter</Link></p>
    </form>
  );
}
