import Img from './Img';
import { saveProduct, deleteImage, deleteProduct } from '@/app/admin/(panel)/products/actions';

export default function ProductForm({ product, categories, images = [], defaultCategory }) {
  const p = product ?? { is_active: true, stock: 0, price: 0 };
  return (
    <>
      <form action={saveProduct} className="float-card form-col">
        {product && <input type="hidden" name="id" value={product.id} />}
        <label>Nom<input name="name" defaultValue={p.name} required /></label>
        <label>Description<textarea name="description" rows={5} defaultValue={p.description ?? ''} /></label>
        <div className="two">
          <label>Prix (FCFA)<input name="price" type="number" min="0" step="1" defaultValue={p.price} required /></label>
          <label>Stock<input name="stock" type="number" min="0" step="1" defaultValue={p.stock} required /></label>
        </div>
        <div className="two">
          <label>Catégorie
            <select name="category_id" defaultValue={p.category_id ?? defaultCategory ?? ''}>
              <option value="">Sans catégorie</option>
              {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </label>
          <label>Seuil « Bientôt épuisé »
            <input name="low_stock_threshold" type="number" min="0" defaultValue={p.low_stock_threshold ?? ''} placeholder="Seuil global" />
          </label>
        </div>
        <label>Vidéo (lien, facultatif)<input name="video_url" type="url" defaultValue={p.video_url ?? ''} /></label>
        <label>Ajouter des photos<input name="images" type="file" accept="image/*" multiple /></label>
        <label className="check"><input name="is_active" type="checkbox" defaultChecked={p.is_active} /> Visible dans la boutique</label>
        <label className="check"><input name="is_popular" type="checkbox" defaultChecked={p.is_popular} /> Produit populaire</label>
        <button className="btn" type="submit">Enregistrer le produit</button>
      </form>

      {product && (
        <>
          <h2>Galerie</h2>
          <div className="grid grid--thumbs">
            {images.map((im) => (
              <div key={im.id} className="float-card thumb">
                <Img src={im.url} alt={im.alt ?? ''} ratio="img-frame--square" sizes="160px" />
                <form action={deleteImage}>
                  <input type="hidden" name="image_id" value={im.id} />
                  <input type="hidden" name="product_id" value={product.id} />
                  <button className="link-danger" type="submit">Retirer</button>
                </form>
              </div>
            ))}
            {!images.length && <p className="muted">Aucune photo pour le moment.</p>}
          </div>
          <form action={deleteProduct}>
            <input type="hidden" name="id" value={product.id} />
            <button className="link-danger" type="submit">Supprimer ce produit</button>
          </form>
        </>
      )}
    </>
  );
}
