import { useEffect, useState } from "react"
import { images } from "../cms/defaultContent"
import type { PageBanner } from "../cms/types"
import { ButtonLink, Icon, PageHero } from "../components/ui"
import {
  foundationMission,
  foundationVision,
  leaders,
  type Leader,
  type LeadershipLanguage,
} from "../content/leadership"
import { AppLink } from "../lib/router"

const LANGUAGE_STORAGE_KEY = "samriddhi-leadership-language"

const banner: PageBanner = {
  eyebrow: "About us",
  title: "Founded to serve, led with care",
  body: "Samriddhi Help Team Foundation was founded in 2025 to bring support, dignity and opportunity to the people who need it most. Meet the people who lead it.",
  imageUrl: images.volunteers,
  imageAlt: "Volunteers working together in the community",
}

const leadershipIntro = {
  en: {
    title: "Founders & core team",
    body: "The foundation is led by people who bring business experience, healthcare work and years of grassroots service to every initiative.",
  },
  hi: {
    title: "संस्थापक एवं मुख्य टीम",
    body: "फाउंडेशन का नेतृत्व ऐसे लोग करते हैं जो प्रत्येक पहल में व्यवसायिक अनुभव, स्वास्थ्य सेवा से जुड़ी समझ और वर्षों की जमीनी सामाजिक सेवा लेकर आते हैं।",
  },
}

function initialLanguage(): LeadershipLanguage {
  if (typeof window === "undefined") return "en"
  try {
    return window.localStorage.getItem(LANGUAGE_STORAGE_KEY) === "hi"
      ? "hi"
      : "en"
  } catch {
    return "en"
  }
}

function LeaderProfile({
  leader,
  language,
}: {
  leader: Leader
  language: LeadershipLanguage
}) {
  const nameId = `${leader.id}-name`
  const name = leader.name[language]
  const role = leader.role[language]

  return (
    <article className="leader-profile" id={leader.id} aria-labelledby={nameId}>
      <div className="leader-profile__aside">
        <div className="leader-profile__photo">
          <img
            src={leader.photo}
            alt={`Portrait of ${leader.name.en}`}
            style={{ objectPosition: leader.photoPosition }}
          />
        </div>
        <div className="leader-profile__identity" lang={language}>
          <h3 id={nameId}>{name}</h3>
          <p className="leader-profile__role">{role}</p>
          <p className="leader-profile__org">Samriddhi Help Team Foundation</p>
        </div>
        {leader.highlights?.length ? (
          <ul className="leader-profile__highlights" lang={language}>
            {leader.highlights.map((item) => (
              <li key={item.label.en}>
                <strong>{item.value[language]}</strong>
                <span>{item.label[language]}</span>
              </li>
            ))}
          </ul>
        ) : null}
      </div>

      <div className="leader-profile__body" lang={language}>
        <p className="leader-profile__tagline">{leader.tagline[language]}</p>
        {leader.intro[language].map((paragraph) => (
          <p key={paragraph}>{paragraph}</p>
        ))}

        {leader.sections.map((section, index) => (
          <section
            className="leader-profile__section"
            key={`${leader.id}-section-${index}`}
          >
            <h4>{section.title[language]}</h4>
            {section.paragraphs?.[language].map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
            {section.listIntro ? <p>{section.listIntro[language]}</p> : null}
            {section.list ? (
              <ul className="leader-list">
                {section.list[language].map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            ) : null}
          </section>
        ))}

        {leader.vision ? (
          <section className="leader-vision">
            <h4>{leader.vision.title[language]}</h4>
            <blockquote>
              <p>“{leader.vision.quote[language]}”</p>
            </blockquote>
            {leader.vision.paragraphs[language].map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
            <p>{leader.vision.beliefLead[language]}</p>
            <p className="leader-vision__belief">
              “{leader.vision.belief[language]}”
            </p>
          </section>
        ) : null}

        {leader.message ? (
          <figure className="leader-message">
            <span className="leader-message__label">
              {leader.message.title[language]}
            </span>
            <blockquote>
              <p>“{leader.message.quote[language]}”</p>
            </blockquote>
            <figcaption>
              <strong>— {name}</strong>
              <span>
                {role}, Samriddhi Help Team Foundation
              </span>
            </figcaption>
          </figure>
        ) : null}
      </div>
    </article>
  )
}

export default function AboutPage() {
  const [language, setLanguage] = useState<LeadershipLanguage>(initialLanguage)
  const copy = leadershipIntro[language]

  useEffect(() => {
    try {
      window.localStorage.setItem(LANGUAGE_STORAGE_KEY, language)
    } catch {
      // The switch still works for this visit if browser storage is unavailable.
    }
  }, [language])

  return (
    <>
      <PageHero banner={banner} />

      <section className="content-section content-section--white">
        <div className="page-shell">
          <div className="about-language">
            <div className="about-language__intro">
              <span className="about-language__badge" aria-hidden="true">
                EN / अ
              </span>
              <div>
                <span className="eyebrow">Biography language</span>
                <strong>Choose English or हिन्दी</strong>
                <small>
                  English is shown by default. Your choice is remembered on this device.
                </small>
              </div>
            </div>
            <div
              className="about-language__switch"
              role="group"
              aria-label="Choose biography language"
            >
              <button
                type="button"
                className={language === "en" ? "is-active" : ""}
                aria-pressed={language === "en"}
                onClick={() => setLanguage("en")}
              >
                English
              </button>
              <button
                type="button"
                className={language === "hi" ? "is-active" : ""}
                aria-pressed={language === "hi"}
                onClick={() => setLanguage("hi")}
                lang="hi"
              >
                हिन्दी
              </button>
            </div>
          </div>

          <div className="about-mission">
            <div className="about-mission__intro" lang={language}>
              <span className="eyebrow">Samriddhi Help Team Foundation</span>
              <h2>{foundationMission.title[language]}</h2>
              {foundationMission.paragraphs[language].map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
            </div>
            <div className="about-areas">
              {foundationMission.areas.map((area) => (
                <article
                  className="about-area"
                  key={area.title.en}
                  lang={language}
                >
                  <span className="about-area__icon" aria-hidden="true">
                    {area.icon}
                  </span>
                  <h3>{area.title[language]}</h3>
                  <p>{area.text[language]}</p>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="content-section" id="leadership">
        <div className="page-shell">
          <div className="route-intro" lang={language}>
            <div>
              <span className="eyebrow">
                {language === "hi" ? "नेतृत्व" : "Leadership"}
              </span>
              <h2 className="team-heading">{copy.title}</h2>
            </div>
            <p>{copy.body}</p>
          </div>
          <nav className="leader-jump" aria-label="Leadership profiles">
            {leaders.map((leader) => (
              <AppLink key={leader.id} to={`/about#${leader.id}`}>
                <img src={leader.photo} alt="" />
                <span lang={language}>{leader.name[language]}</span>
              </AppLink>
            ))}
          </nav>
          {leaders.map((leader) => (
            <LeaderProfile
              key={leader.id}
              leader={leader}
              language={language}
            />
          ))}
        </div>
      </section>

      <section className="content-section content-section--gray">
        <div className="page-shell about-vision" lang={language}>
          <div>
            <span className="eyebrow">
              {language === "hi" ? "हमारा विज़न" : "Our vision"}
            </span>
            <h2>{foundationVision.title[language]}</h2>
            <p className="about-vision__motto">
              {foundationVision.motto[language].map((part, index) => (
                <span key={part}>
                  {index > 0 ? <i aria-hidden="true">|</i> : null}
                  {part}
                </span>
              ))}
            </p>
            <p className="about-vision__intro">
              {foundationVision.intro[language]}
            </p>
            <div className="about-vision__actions">
              <ButtonLink to="/join">
                {language === "hi" ? "हमसे जुड़ें" : "Join us"}
              </ButtonLink>
              <ButtonLink to="/donate" kind="text">
                {language === "hi" ? "हमारे कार्य में सहयोग करें" : "Support our work"}
              </ButtonLink>
            </div>
          </div>
          <ul className="about-vision__list">
            {foundationVision.points[language].map((point) => (
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
