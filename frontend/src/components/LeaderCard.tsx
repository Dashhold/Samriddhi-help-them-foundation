import type { Leader, LeadershipLanguage } from "../content/leadership"
import { AppLink } from "../lib/router"
import { Icon } from "./ui"

export default function LeaderCard({
  leader,
  language = "en",
}: {
  leader: Leader
  language?: LeadershipLanguage
}) {
  const name = leader.name[language]
  const role = leader.role[language]
  const tagline = leader.tagline[language]
  const linkLabel = language === "hi" ? "प्रोफ़ाइल पढ़ें" : "Read profile"

  return (
    <article className="leader-card" lang={language}>
      <div className="leader-card__photo">
        <img
          src={leader.photo}
          alt={`Portrait of ${leader.name.en}, ${leader.role.en}`}
          loading="lazy"
          style={{ objectPosition: leader.photoPosition }}
        />
      </div>
      <div className="leader-card__body">
        <span className="leader-card__role">{role}</span>
        <h3>{name}</h3>
        <p>{tagline}</p>
        <AppLink
          className="leader-card__link"
          to={`/about#${leader.id}`}
          aria-label={`Read the profile of ${leader.name.en}`}
        >
          {linkLabel} <Icon name="arrow" size={16} />
        </AppLink>
      </div>
    </article>
  )
}
