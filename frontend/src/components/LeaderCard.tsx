import type { Leader } from "../content/leadership"
import { AppLink } from "../lib/router"
import { Icon } from "./ui"

export default function LeaderCard({ leader }: { leader: Leader }) {
  return (
    <article className="leader-card">
      <div className="leader-card__photo">
        <img
          src={leader.photo}
          alt={`Portrait of ${leader.englishName}, ${leader.role}`}
          loading="lazy"
          style={{ objectPosition: leader.photoPosition }}
        />
      </div>
      <div className="leader-card__body">
        <span className="leader-card__role">{leader.role}</span>
        <h3 lang="hi">{leader.name}</h3>
        <p lang="hi">{leader.tagline}</p>
        <AppLink
          className="leader-card__link"
          to={`/about#${leader.id}`}
          aria-label={`Read the profile of ${leader.englishName}`}
        >
          Read profile <Icon name="arrow" size={16} />
        </AppLink>
      </div>
    </article>
  )
}
