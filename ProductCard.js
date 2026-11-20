import Link from 'next/link';
import Img from './Img';
import { fcfa } from '@/lib/helpers';
import { cover, isLow } from '@/lib/data';

export default function ProductCard({ product: p, settings }) {
  const low = isLow(p, settings);
  return (
    <Link href={`/produits/${p.slug}`} className="float-card pcard">
      <Img src={cover(p)} alt={p.name} ratio="img-frame--square" />
      <div className="pcard-body">
        <strong>{p.name}</strong>
        <span className="price">{fcfa(p.price)}</span>
        <span className={`stock ${low ? 'stock--low' : 'stock--ok'}`}>{low ? 'Bientôt épuisé' : 'En stock'}</span>
      </div>
    </Link>
  );
}
