import { useCms } from "../cms/CmsProvider";
import NewsCard from "../components/NewsCard";
import { ButtonLink, Icon, PageHero, formatDate } from "../components/ui";
import { AppLink, resolvePublicAsset } from "../lib/router";

export function NewsPage() {
  const { content } = useCms();
  const news = content.news.filter((item) => item.status === "published").sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
  const featured = news.find((item) => item.featured) ?? news[0];
  const rest = news.filter((item) => item.id !== featured?.id);
  return <><PageHero banner={content.pageBanners.news}/><section className="content-section"><div className="page-shell">{featured && <article className="news-feature"><div className="news-feature__image"><img src={resolvePublicAsset(featured.imageUrl)} alt={featured.imageAlt}/></div><div className="news-feature__copy"><span className="eyebrow">Featured · {featured.category}</span><h2>{featured.title}</h2><p>{featured.summary}</p><ButtonLink to={`/news/${featured.slug}`} kind="light">Read full update</ButtonLink></div></article>}{rest.length ? <div className="news-grid">{rest.map((item) => <NewsCard item={item} key={item.id}/>)}</div> : !featured && <div className="empty-state"><Icon name="news" size={35}/><h3>No published updates yet</h3><p>New announcements created in the admin dashboard will appear here after they are marked as published.</p></div>}</div></section></>;
}

export function NewsArticlePage({ slug }: { slug: string }) {
  const { content } = useCms();
  const item = content.news.find((entry) => entry.slug === slug && entry.status === "published");
  if (!item) return <section className="not-found"><h1>404</h1><h2>Update not found</h2><p>This story may be in draft or may have moved.</p><ButtonLink to="/news">Back to news</ButtonLink></section>;
  return <article className="article" style={{ marginTop: 88 }}><div className="article__shell"><AppLink className="article__back" to="/news"><Icon name="arrow" size={16}/> All news</AppLink><div className="article__meta"><span>{item.category}</span><span>•</span><time dateTime={item.publishedAt}>{formatDate(item.publishedAt)}</time><span>•</span><span>{item.author}</span></div><h1>{item.title}</h1><p className="article__summary">{item.summary}</p><div className="article__image"><img src={resolvePublicAsset(item.imageUrl)} alt={item.imageAlt}/></div><div className="article__body">{item.body}</div><div className="article__documents"><strong>Verify organisation information</strong><p>Official registration and compliance records referenced in our updates are available in the public document centre.</p><ButtonLink to="/documents" kind="text">Open documents</ButtonLink></div></div></article>;
}
