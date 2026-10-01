import { NewsItem } from "../cms/types"
import { AppLink, resolvePublicAsset } from "../lib/router"
import { Icon, formatDate } from "./ui"

export default function NewsCard({ item }: { item: NewsItem }) {
  return (
    <article className="news-card">
      <div className="news-card__image">
        <img
          src={resolvePublicAsset(item.imageUrl)}
          alt={item.imageAlt}
          loading="lazy"
        />
      </div>
      <div className="news-card__body">
        <div className="news-card__meta">
          <span>{item.category}</span>
          <i />
          <time dateTime={item.publishedAt}>
            {formatDate(item.publishedAt)}
          </time>
        </div>
        <h3>{item.title}</h3>
        <p>{item.summary}</p>
        <AppLink to={`/news/${item.slug}`}>
          Read update <Icon name="arrow" size={17} />
        </AppLink>
      </div>
    </article>
  )
}
