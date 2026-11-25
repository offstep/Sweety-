import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { isValidPhone, normalizePhone, phoneEmail } from '@/lib/phone';

async function signIn(formData) {
  'use server';
  const phone = normalizePhone(formData.get('phone'));
  if (!isValidPhone(phone)) redirect('/connexion?error=identifiants');
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: phoneEmail(phone), password: String(formData.get('password') || ''),
  });
  if (error) redirect('/connexion?error=identifiants');
  redirect('/compte');
}

export default async function Connexion({ searchParams }) {
  const { error } = await searchParams;
  return (
    <form action={signIn} className="float-section auth">
      <h1 className="sec-title">Connexion</h1>
      {error && <p className="msg msg--err">Numéro ou mot de passe incorrect.</p>}
      <label>Numéro de téléphone<input name="phone" type="tel" inputMode="tel" required autoComplete="tel" /></label>
      <label>Mot de passe<input name="password" type="password" required autoComplete="current-password" /></label>
      <button className="btn" type="submit">Se connecter</button>
      <p className="muted">Pas encore de compte ? <Link href="/inscription" className="link">S'inscrire</Link></p>
    </form>
  );
}
