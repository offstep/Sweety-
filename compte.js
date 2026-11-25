import { sb, $, esc, boot, normalizePhone, phoneEmail } from './app.js';

await boot('compte');
const app = $('#app');
const valid = (d) => d.length >= 8 && d.length <= 15;

async function render() {
  const { data: { session } } = await sb.auth.getSession();
  const mode = location.hash === '#inscription' ? 'signup' : 'login';
  if (session) {
    const { data: p } = await sb.from('profiles').select('full_name, phone, role').eq('id', session.user.id).maybeSingle();
    app.innerHTML = `<section class="float-section auth"><h1 class="sec-title">Mon compte</h1>
      <div class="float-card account"><strong>${esc(p?.full_name || 'Client')}</strong><span class="muted">${esc(p?.phone || '')}</span></div>
      ${p?.role === 'admin' ? '<a class="btn btn--ghost" href="admin/index.html">Espace administrateur</a>' : ''}
      <button class="btn btn--ghost" id="out">Se déconnecter</button></section>`;
    $('#out').onclick = async () => { await sb.auth.signOut(); render(); };
    return;
  }
  app.innerHTML = `<section class="float-section auth">
    <div class="tabs"><a href="#connexion" ${mode === 'login' ? 'aria-current="page"' : ''}>Connexion</a><a href="#inscription" ${mode === 'signup' ? 'aria-current="page"' : ''}>Inscription</a></div>
    <form id="f" class="auth">
      <p class="msg msg--err" id="err" hidden></p>
      ${mode === 'signup' ? '<label>Nom complet<input name="name" required autocomplete="name"></label>' : ''}
      <label>Numéro de téléphone<input name="phone" type="tel" inputmode="tel" required autocomplete="tel" placeholder="07 00 00 00 00"></label>
      <label>Mot de passe<input name="password" type="password" minlength="${mode === 'signup' ? 8 : 1}" required autocomplete="${mode === 'signup' ? 'new-password' : 'current-password'}"></label>
      ${mode === 'signup' ? '<label>Confirmer le mot de passe<input name="confirm" type="password" minlength="8" required autocomplete="new-password"></label>' : ''}
      <button class="btn" type="submit">${mode === 'signup' ? "S'inscrire" : 'Se connecter'}</button>
    </form></section>`;
  const err = (m) => { const e = $('#err'); e.textContent = m; e.hidden = false; };
  $('#f').onsubmit = async (ev) => {
    ev.preventDefault();
    const f = new FormData(ev.target);
    const phone = normalizePhone(f.get('phone')); const password = String(f.get('password'));
    if (!valid(phone)) return err('Numéro de téléphone invalide.');
    const btn = ev.target.querySelector('button'); btn.disabled = true;
    if (mode === 'signup') {
      const name = String(f.get('name')).trim().slice(0, 120);
      if (name.length < 2) { btn.disabled = false; return err('Indique ton nom complet.'); }
      if (password.length < 8) { btn.disabled = false; return err('Le mot de passe doit faire au moins 8 caractères.'); }
      if (password !== f.get('confirm')) { btn.disabled = false; return err('Les mots de passe ne correspondent pas.'); }
      const { data, error } = await sb.auth.signUp({ email: phoneEmail(phone), password, options: { data: { full_name: name, phone } } });
      btn.disabled = false;
      if (error) return err(/registered|exists/i.test(error.message) ? 'Un compte existe déjà avec ce numéro. Connecte-toi.' : "L'inscription a échoué. Réessaie dans un instant.");
      if (!data.session) return err('Inscription enregistrée, mais la confirmation par e-mail est encore activée dans Supabase : désactive « Confirm email ».');
    } else {
      const { error } = await sb.auth.signInWithPassword({ email: phoneEmail(phone), password });
      btn.disabled = false;
      if (error) return err('Numéro ou mot de passe incorrect.');
    }
    location.hash = ''; render();
  };
}
window.addEventListener('hashchange', render);
render();
