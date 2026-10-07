import type { ReactNode } from "react"
import type { PageBanner } from "../cms/types"
import { ButtonLink, Icon, PageHero } from "./ui"

export type LegalSection = {
  id: string
  title: string
  body: ReactNode
}

type LegalPageProps = {
  banner: PageBanner
  overview: {
    eyebrow: string
    title: string
    summary: string
    scope: string
    updated: { dateTime: string; label: string }
  }
  glance: {
    label: string
    title: string
    text: string
    facts: readonly (readonly [string, ReactNode])[]
    link: { to: string; label: string }
  }
  sections: readonly LegalSection[]
}

/** Shared layout for policy pages. It reuses the Privacy Policy page styles (privacy.css). */
export default function LegalPage({
  banner,
  overview,
  glance,
  sections,
}: LegalPageProps) {
  return (
    <>
      <PageHero banner={banner} />

      <section className="content-section policy-overview">
        <div className="page-shell policy-overview__grid">
          <div className="policy-overview__copy">
            <span className="eyebrow">{overview.eyebrow}</span>
            <h2>{overview.title}</h2>
            <p>{overview.summary}</p>
            <div className="policy-meta">
              <Icon name="shield" size={22} />
              <div>
                <strong>
                  Effective and last updated:{" "}
                  <time dateTime={overview.updated.dateTime}>
                    {overview.updated.label}
                  </time>
                </strong>
                <span>{overview.scope}</span>
              </div>
            </div>
          </div>

          <aside className="policy-controller" aria-label={glance.title}>
            <span className="policy-controller__label">{glance.label}</span>
            <h2>{glance.title}</h2>
            <p>{glance.text}</p>
            <dl>
              {glance.facts.map(([term, detail]) => (
                <div key={term}>
                  <dt>{term}</dt>
                  <dd>{detail}</dd>
                </div>
              ))}
            </dl>
            <ButtonLink to={glance.link.to} kind="light">
              {glance.link.label}
            </ButtonLink>
          </aside>
        </div>
      </section>

      <section className="content-section content-section--gray">
        <div className="page-shell policy-layout">
          <aside className="policy-toc" aria-label={`${banner.title} sections`}>
            <span>On this page</span>
            <nav>
              {sections.map(({ id, title }) => (
                <a key={id} href={`#${id}`}>
                  {title}
                </a>
              ))}
            </nav>
          </aside>

          <article className="policy-document">
            {sections.map(({ id, title, body }, index) => (
              <section className="policy-section" id={id} key={id}>
                <span className="policy-section__number">
                  Section {String(index + 1).padStart(2, "0")}
                </span>
                <h2>{title}</h2>
                {body}
              </section>
            ))}
          </article>
        </div>
      </section>
    </>
  )
}
