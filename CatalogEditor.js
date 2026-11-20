import Img from './Img';
import { fcfa } from '@/lib/helpers';
import * as A from '@/app/admin/(panel)/products/catalog-actions';

const Del = ({ action, id, productId, label = 'Retirer' }) => (
  <form action={action} className="inline">
    <input type="hidden" name="id" value={id} />
    <input type="hidden" name="product_id" value={productId} />
    <button className="link-danger" type="submit">{label}</button>
  </form>
);

export default function CatalogEditor({ productId, images, optionTypes, supplements }) {
  const pid = <input type="hidden" name="product_id" value={productId} />;
  return (
    <section id="catalogue">
      <h2>Variantes</h2>
      <p className="muted">Couleur, taille, marque, modèle, matière… Pour une couleur, associe une photo : elle s'affichera quand le client la choisit.</p>

      {optionTypes.map((t) => (
        <div key={t.id} className="float-card block">
          <div className="head">
            <strong>{t.name} <small className="muted">({t.kind === 'color' ? 'couleurs' : t.kind === 'select' ? 'menu' : 'boutons'})</small></strong>
            <Del action={A.deleteOptionType} id={t.id} productId={productId} label="Supprimer la variante" />
          </div>
          <ul className="chips">
            {(t.option_values ?? []).map((v) => {
              const im = images.find((i) => i.id === v.image_id);
              return (
                <li key={v.id} className="chip">
                  {v.color_hex && <i className="dot" style={{ background: v.color_hex }} />}
                  {im && <span className="mini"><Img src={im.url} alt={v.label} ratio="img-frame--square" sizes="32px" /></span>}
                  {v.label}
                  <Del action={A.deleteOptionValue} id={v.id} productId={productId} label="×" />
                </li>
              );
            })}
          </ul>
          <form action={A.addOptionValue} className="form-inline">
            {pid}<input type="hidden" name="option_type_id" value={t.id} />
            <input name="label" placeholder={t.kind === 'color' ? 'Ex. Noir' : 'Ex. 42'} required />
            {t.kind === 'color' && <input name="color_hex" type="color" defaultValue="#000000" aria-label="Couleur" />}
            {t.kind === 'color' && (
              <select name="image_id" defaultValue="">
                <option value="">Photo liée (aucune)</option>
                {images.map((im, i) => <option key={im.id} value={im.id}>Photo {i + 1}</option>)}
              </select>
            )}
            <button className="btn btn--ghost" type="submit">Ajouter</button>
          </form>
        </div>
      ))}

      <form action={A.addOptionType} className="float-card form-inline block">
        {pid}
        <input name="name" placeholder="Nouvelle variante (Couleur, Taille…)" required />
        <select name="kind" defaultValue="button">
          <option value="color">Couleurs</option><option value="button">Boutons</option><option value="select">Menu déroulant</option>
        </select>
        <button className="btn" type="submit">Créer</button>
      </form>

      <h2>Suppléments</h2>
      <p className="muted">Accessoires proposés avec ce produit : leur prix s'ajoute au total.</p>

      {supplements.map((s) => (
        <div key={s.id} className="float-card block">
          <div className="head">
            <div className="sup">
              <span className="mini mini--lg"><Img src={s.image_url} alt={s.name} ratio="img-frame--square" sizes="64px" /></span>
              <div><strong>{s.name}</strong> <span className="price">{fcfa(s.price)}</span>
                <div className="muted">{s.is_required ? 'Obligatoire' : 'Facultatif'}</div></div>
            </div>
            <Del action={A.deleteSupplement} id={s.id} productId={productId} label="Supprimer" />
          </div>
          <ul className="chips">
            {(s.supplement_option_types ?? []).map((o) => (
              <li key={o.id} className="chip">{o.name} : {o.values.join(' / ')}
                <Del action={A.deleteSupplementOption} id={o.id} productId={productId} label="×" /></li>
            ))}
          </ul>
          <form action={A.addSupplementOption} className="form-inline">
            {pid}<input type="hidden" name="supplement_id" value={s.id} />
            <input name="name" placeholder="Variante (Couleur, Marque…)" required />
            <input name="values" placeholder="Valeurs : Noir, Blanc" required />
            <button className="btn btn--ghost" type="submit">Ajouter</button>
          </form>
        </div>
      ))}

      <form action={A.addSupplement} className="float-card form-col block">
        {pid}
        <div className="two">
          <label>Nom<input name="name" placeholder="Chaussettes" required /></label>
          <label>Prix (FCFA)<input name="price" type="number" min="0" step="1" defaultValue="0" required /></label>
        </div>
        <label>Description<input name="description" /></label>
        <label>Image<input name="image" type="file" accept="image/*" /></label>
        <label className="check"><input name="is_required" type="checkbox" /> Supplément obligatoire</label>
        <button className="btn" type="submit">Ajouter le supplément</button>
      </form>
    </section>
  );
}
