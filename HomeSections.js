import Link from 'next/link';
import Img from './Img';
import ProductCard from './ProductCard';
import { createClient } from '@/lib/supabase/server';
import { getProducts } from '@/lib/data';

const safe = (u) => (/^https?:\/\/|^\//.test(u || '') ? u : null);
const Title = ({ children }) => (children ? <h2 className="sec-title">{children}</h2> : null);
const Cta = ({ c }) => (c.button_label && safe(c.link_url) ? <Link className="btn" href={c.link_url}>{c.button_label}</Link> : null);

function Grid({ title, list, settings, large }) {
  if (!list.length) return null;
  return (
    <section className="float-section"><Title>{title}</Title>
      <div className={`pgrid${large ? ' pgrid--large' : ''}`}>{list.map((p) => <ProductCard key={p.id} product={p} settings={settings} large={large} />)}</div>
    </section>
  );
}
function Slider({ s, ratio }) {
  const imgs = (s.config?.images ?? []).filter((i) => safe(i.url));
  if (!imgs.length) return null;
  return (
    <section className="float-section"><Title>{s.title}</Title>
      <div className="carousel">
        {imgs.map((i, n) => {
          const el = <Img src={i.url} alt={i.alt ?? ''} ratio={ratio} sizes="(max-width:768px) 75vw, 360px" className="float-img" />;
          return safe(i.link) ? <Link key={n} href={i.link}>{el}</Link> : <div key={n}>{el}</div>;
        })}
      </div>
    </section>
  );
}
function Pill({ s }) {
  const c = s.config ?? {};
  const label = c.title || c.text;
  if (!label) return null;
  return safe(c.link_url) ? <Link href={c.link_url} className="pill-banner">{label}</Link> : <div className="pill-banner">{label}</div>;
}
function Hero({ s }) {
  const c = s.config ?? {};
  if (!safe(c.image_url)) return (
    <section className="hero hero--plain float-card">
      {c.title && <h2>{c.title}</h2>}{c.subtitle && <p>{c.subtitle}</p>}<Cta c={c} />
    </section>
  );
  return (
    <section className="hero float-card">
      <Img src={c.image_url} alt={c.title ?? ''} ratio="img-frame--banner" priority sizes="100vw" />
      <div className="hero-cap">{c.title && <h2>{c.title}</h2>}{c.subtitle && <p>{c.subtitle}</p>}<Cta c={c} /></div>
    </section>
  );
}

export default async function HomeSections({ settings }) {
  const supabase = await createClient();
  const { data: sections } = await supabase.from('home_sections').select('*').eq('is_visible', true).order('position');
  if (!sections?.length) return <p className="empty">Aucune section n'est encore configurée. Ajoutez-en depuis l'administration.</p>;

  const out = [];
  for (const s of sections) {
    const c = s.config ?? {};
    switch (s.type) {
      case 'hero_banner': out.push(<Hero key={s.id} s={s} />); break;
      case 'custom_banner': out.push(safe(c.image_url) ? <Hero key={s.id} s={s} /> : <Pill key={s.id} s={s} />); break;
      case 'image_slider': case 'carousel': out.push(<Slider key={s.id} s={s} ratio="img-frame--wide" />); break;
      case 'categories': {
        const { data: cats } = await supabase.from('categories').select('id, name, slug, image_url').eq('is_active', true).order('position').order('name');
        if (cats?.length && c.style === 'chips') out.push(
          <section key={s.id} className="float-section"><Title>{s.title || 'Catégories'}</Title>
            <div className="chips">{cats.map((k) => <Link key={k.id} href={`/categories/${k.slug}`} className="chip-link">{k.name}</Link>)}</div>
          </section>);
        else if (cats?.length) out.push(
          <section key={s.id} className="float-section"><Title>{s.title || 'Catégories'}</Title>
            <div className="carousel carousel--cats">
              {cats.map((k) => (
                <Link key={k.id} href={`/categories/${k.slug}`} className="catlink">
                  <Img src={k.image_url} alt={k.name} ratio="img-frame--square" sizes="120px" className="round float-img" />{k.name}
                </Link>))}
            </div>
          </section>);
        break;
      }
      case 'popular': out.push(<Grid key={s.id} title={s.title || 'Produits populaires'} list={await getProducts({ popular: true })} settings={settings} large={c.layout === 'large'} />); break;
      case 'new_arrivals': out.push(<Grid key={s.id} title={s.title || 'Nouveautés'} list={await getProducts()} settings={settings} large={c.layout === 'large'} />); break;
      case 'recommendations': out.push(<Grid key={s.id} title={s.title || 'Recommandations'} list={(await getProducts({ limit: 24 })).sort(() => Math.random() - 0.5).slice(0, 8)} settings={settings} />); break;
      case 'promotions': {
        const { data: promos } = await supabase.from('promotions').select('id, name').eq('is_active', true);
        if (promos?.length) out.push(
          <section key={s.id} className="float-section"><Title>{s.title || 'Promotions'}</Title>
            <div className="carousel">{promos.map((p) => <div key={p.id} className="float-card promo-tile"><strong>{p.name}</strong></div>)}</div>
          </section>);
        break;
      }
      case 'partner_ads': {
        const { data: ads } = await supabase.from('ads').select('id, business_name, title, description, image_url, cta_label, link_url').eq('is_active', true);
        if (ads?.length) out.push(
          <section key={s.id} className="float-section"><Title>{s.title || 'Nos partenaires'}</Title>
            <div className="carousel">
              {ads.map((a) => (
                <article key={a.id} className="float-card ad">
                  <small className="ad-tag">Publicité · {a.business_name}</small>
                  <Img src={a.image_url} alt={a.title} ratio="img-frame--wide" />
                  <div className="pcard-body"><strong>{a.title}</strong><span className="muted">{a.description}</span></div>
                  {a.cta_label && safe(a.link_url) && <a className="btn btn--ghost ad-btn" href={a.link_url} target="_blank" rel="noopener sponsored">{a.cta_label}</a>}
                </article>))}
            </div>
          </section>);
        break;
      }
      case 'text_image': out.push(
        <section key={s.id} className="float-section textimg">
          <Img src={c.image_url} alt={c.title ?? ''} ratio="img-frame--wide" className="float-img" />
          <div>{c.title && <h2 className="sec-title">{c.title}</h2>}<p className="muted">{c.text}</p><Cta c={c} /></div>
        </section>); break;
    }
  }
  return <>{out}</>;
}
