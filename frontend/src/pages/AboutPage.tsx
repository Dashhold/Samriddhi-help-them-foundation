import { images } from "../cms/defaultContent"
import type { PageBanner } from "../cms/types"
import { ButtonLink, Icon, PageHero } from "../components/ui"
import {
  foundationMission,
  foundationVision,
  leaders,
  type Leader,
} from "../content/leadership"
import { AppLink } from "../lib/router"

const banner: PageBanner = {
  eyebrow: "About us",
  title: "Founded to serve, led with care",
  body: "Samriddhi Help Team Foundation was founded in 2025 to bring support, dignity and opportunity to the people who need it most. Meet the people who lead it.",
  imageUrl: images.volunteers,
  imageAlt: "Volunteers working together in the community",
}

function LeaderProfile({ leader }: { leader: Leader }) {
  const nameId = `${leader.id}-name`
  return (
    <article className="leader-profile" id={leader.id} aria-labelledby={nameId}>
      <div className="leader-profile__aside">
        <div className="leader-profile__photo">
          <img
            src={leader.photo}
            alt={`Portrait of ${leader.englishName}`}
            style={{ objectPosition: leader.photoPosition }}
          />
        </div>
        <div className="leader-profile__identity">
          <h3 id={nameId} lang="hi">
            {leader.name}
          </h3>
          <p className="leader-profile__role">{leader.role}</p>
          <p className="leader-profile__org">Samriddhi Help Team Foundation</p>
        </div>
        {leader.highlights?.length ? (
          <ul className="leader-profile__highlights">
            {leader.highlights.map((item) => (
              <li key={item.label}>
                <strong lang="hi">{item.value}</strong>
                <span lang="hi">{item.label}</span>
              </li>
            ))}
          </ul>
        ) : null}
      </div>

      <div className="leader-profile__body" lang="hi">
        <p className="leader-profile__tagline">{leader.tagline}</p>
        {leader.intro.map((paragraph) => (
          <p key={paragraph}>{paragraph}</p>
        ))}

        {leader.sections.map((section) => (
          <section className="leader-profile__section" key={section.title}>
            <h4>{section.title}</h4>
            {section.paragraphs?.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
            {section.listIntro ? <p>{section.listIntro}</p> : null}
            {section.list ? (
              <ul className="leader-list">
                {section.list.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            ) : null}
          </section>
        ))}

        {leader.vision ? (
          <section className="leader-vision">
            <h4 lang="en">{leader.vision.title}</h4>
            <blockquote>
              <p>“{leader.vision.quote}”</p>
            </blockquote>
            {leader.vision.paragraphs.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
            <p>{leader.vision.beliefLead}</p>
            <p className="leader-vision__belief">“{leader.vision.belief}”</p>
          </section>
        ) : null}

        {leader.message ? (
          <figure className="leader-message">
            <span className="leader-message__label" lang="en">
              {leader.message.title}
            </span>
            <blockquote>
              <p>“{leader.message.quote}”</p>
            </blockquote>
            <figcaption>
              <strong>— {leader.name}</strong>
              <span lang="en">
                {leader.role}, Samriddhi Help Team Foundation
              </span>
            </figcaption>
          </figure>
        ) : null}
      </div>
    </article>
  )
}

export default function AboutPage() {
  return (
    <>
      <PageHero banner={banner} />

      <section className="content-section content-section--white">
        <div className="page-shell about-mission">
          <div className="about-mission__intro">
            <span className="eyebrow">Samriddhi Help Team Foundation</span>
            <h2 lang="hi">{foundationMission.title}</h2>
            {foundationMission.paragraphs.map((paragraph) => (
              <p key={paragraph} lang="hi">
                {paragraph}
              </p>
            ))}
          </div>
          <div className="about-areas">
            {foundationMission.areas.map((area) => (
              <article className="about-area" key={area.title} lang="hi">
                <span className="about-area__icon" aria-hidden="true">
                  {area.icon}
                </span>
                <h3>{area.title}</h3>
                <p>{area.text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="content-section" id="leadership">
        <div className="page-shell">
          <div className="route-intro">
            <div>
              <span className="eyebrow">Leadership</span>
              <h2 className="team-heading">Founders & core team</h2>
            </div>
            <p>
              The foundation is led by people who bring business experience,
              healthcare work and years of grassroots service to every
              initiative.
            </p>
          </div>
          <nav className="leader-jump" aria-label="Leadership profiles">
            {leaders.map((leader) => (
              <AppLink key={leader.id} to={`/about#${leader.id}`}>
                <img src={leader.photo} alt="" />
                <span lang="hi">{leader.name}</span>
              </AppLink>
            ))}
          </nav>
          {leaders.map((leader) => (
            <LeaderProfile key={leader.id} leader={leader} />
          ))}
        </div>
      </section>

      <section className="content-section content-section--gray">
        <div className="page-shell about-vision">
          <div>
            <span className="eyebrow">Our vision</span>
            <h2 lang="hi">{foundationVision.title}</h2>
            <p className="about-vision__motto" lang="hi">
              {foundationVision.motto.map((part, index) => (
                <span key={part}>
                  {index > 0 ? <i aria-hidden="true">|</i> : null}
                  {part}
                </span>
              ))}
            </p>
            <p className="about-vision__intro" lang="hi">
              {foundationVision.intro}
            </p>
            <div className="about-vision__actions">
              <ButtonLink to="/join">Join us</ButtonLink>
              <ButtonLink to="/donate" kind="text">
                Support our work
              </ButtonLink>
            </div>
          </div>
          <ul className="about-vision__list" lang="hi">
            {foundationVision.points.map((point) => (
              <li key={point}>
                <Icon name="check" size={18} />
                <span>{point}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </>
  )
}
